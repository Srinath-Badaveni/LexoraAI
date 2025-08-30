# utils/llm_chain.py

import os
from typing import List, Optional
from sentence_transformers import SentenceTransformer, util
from huggingface_hub import snapshot_download, login
import torch
import re

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
MODEL_NAME = "ibm-granite/granite-embedding-english-r2"
MODEL_LOCAL_PATH = os.path.join(MODELS_DIR, MODEL_NAME.replace('/', '_'))

def initialize_models(hf_token: Optional[str] = None) -> bool:
    """Initialize the models with Hugging Face token."""
    try:
        if hf_token:
            login(token=hf_token)
        # Test model initialization
        model = get_model()
        return True
    except Exception as e:
        print(f"Error initializing models: {e}")
        return False

def get_model():
    """Get or download the sentence transformer model."""
    if not os.path.exists(MODEL_LOCAL_PATH):
        os.makedirs(MODELS_DIR, exist_ok=True)
        snapshot_download(repo_id=MODEL_NAME, local_dir=MODEL_LOCAL_PATH, ignore_patterns=["*.h5", "*.ot", "*.msgpack"])
    return SentenceTransformer(MODEL_LOCAL_PATH)

def extract_relevant_chunks(question: str, document_chunks: List[str], top_k: int = 3) -> List[str]:
    """Extract the most relevant chunks for the question using semantic similarity."""
    try:
        model = get_model()
        question_embedding = model.encode([question], normalize_embeddings=True, convert_to_tensor=True)
        chunk_embeddings = model.encode(document_chunks, normalize_embeddings=True, convert_to_tensor=True)
        
        similarities = util.cos_sim(question_embedding, chunk_embeddings)[0]
        top_indices = similarities.argsort(descending=True)[:top_k]

        relevant_chunks = []
        for idx in top_indices:
            if similarities[idx] > 0.2:
                relevant_chunks.append(document_chunks[idx.item()])
        
        return relevant_chunks if relevant_chunks else document_chunks[:top_k]
    except Exception as e:
        print(f"Error in chunk extraction: {e}")
        return document_chunks[:top_k] if document_chunks else []

def extract_relevant_sentences(question: str, chunk: str, top_n: int = 2) -> str:
    """Extract the most relevant sentences from a chunk using semantic similarity."""
    try:
        model = get_model()
        sentences = re.split(r'(?<=[.!?]) +', chunk)
        if not sentences:
            return chunk

        question_embedding = model.encode([question], normalize_embeddings=True, convert_to_tensor=True)
        sentence_embeddings = model.encode(sentences, normalize_embeddings=True, convert_to_tensor=True)

        similarities = util.cos_sim(question_embedding, sentence_embeddings)[0]
        top_indices = similarities.argsort(descending=True)[:top_n]

        best_sentences = [sentences[idx] for idx in top_indices]
        return ' '.join(best_sentences).strip()
    except Exception as e:
        print(f"Error extracting sentences: {e}")
        return chunk

def clean_and_format_response(response: str, question: str) -> str:
    """Clean and format the response based on question type."""
    response = re.sub(r'^\d+\.\s*', '', response)
    response = re.sub(r'\s+', ' ', response).strip()
    
    question_lower = question.lower().strip()
    
    if question_lower.startswith(('what is', 'define', 'definition of')):
        sentences = response.split('.')
        if len(sentences) > 1 and len(sentences[0]) > 20:
            return sentences[0].strip() + '.'
    
    elif question_lower.startswith(('list', 'what are', 'name', 'identify')):
        if ',' in response and len(response.split(',')) > 2:
            items = [item.strip() for item in response.split(',')]
            return '• ' + '\n• '.join(items[:10])
    
    elif question_lower.startswith(('how', 'steps', 'process', 'procedure')):
        sentences = [s.strip() for s in response.split('.') if s.strip()]
        if len(sentences) > 1:
            numbered_steps = []
            for i, sentence in enumerate(sentences[:8], 1):
                if sentence:
                    numbered_steps.append(f"{i}. {sentence}")
            return '\n'.join(numbered_steps)
    
    return response

def process_with_llm(prompt: str, document_chunks: Optional[List[str]] = None) -> str:
    """Process a prompt using the model and document chunks with improved relevance."""
    if not document_chunks:
        return "No document context available to answer this question."
    
    try:
        question = prompt.split("Question:")[-1].strip() if "Question:" in prompt else prompt
        relevant_chunks = extract_relevant_chunks(question, document_chunks, top_k=3)
        
        if not relevant_chunks:
            return "I couldn't find relevant information in the document to answer this question."
        
        best_chunk = relevant_chunks[0]

        # 🔹 Extract only the most relevant sentences instead of returning full chunk
        refined_text = extract_relevant_sentences(question, best_chunk, top_n=2)
        
        formatted_response = clean_and_format_response(refined_text, question)
        return formatted_response
    except Exception as e:
        return f"Error processing question: {str(e)}"

def generate_response(question: str, chunks: List[str]) -> str:
    """Generate a response using the enhanced RAG system with improved prompt."""
    system_prompt = f"""Answer the given question using ONLY the information provided in the supplied document content.

INSTRUCTIONS:
• Be direct, concise, and accurate
• Do NOT add any external knowledge or assumptions beyond the document
• If the information is not present in the document, clearly state: "The document does not contain information about [topic]"
• Remove section numbers, headings, or reference markers from answers
• Use appropriate formatting based on question type:

FOR DEFINITIONS ("what is", "define"):
- Provide a clear, complete definition in 1-2 sentences
- Bold key terms: **term**

FOR LISTS ("list", "what are", "name"):
- Use bullet points (•) or numbered format
- Be comprehensive but concise
- Maximum 10 items

FOR PROCEDURES ("how", "steps", "process"):
- Use numbered steps (1., 2., 3.)
- Keep steps clear and actionable
- Maximum 8 steps

FOR IDENTIFICATION ("who", "which", "where"):
- State only what's explicitly mentioned
- Be specific and factual

AVOID:
- Phrases like "Based on the document" or "According to the text"
- Adding information not in the source
- Overly complex explanations
- Repetitive content

Question: {question}

Document Content: {' '.join(chunks)}

Answer:"""
    return process_with_llm(system_prompt, chunks)

async def process_chunk_with_llm_async(prompt: str, chunks: List[str]) -> str:
    """Async version of the LLM processing function."""
    return generate_response(prompt.split("Question:")[-1].strip() if "Question:" in prompt else prompt, chunks)

def validate_response_quality(response: str, question: str) -> str:
    """Validate and improve response quality."""
    if not response or len(response.strip()) < 10:
        return "The document does not contain sufficient information to answer this question."
    
    if "error" in response.lower() and "processing" in response.lower():
        return "I encountered an issue processing this question. Please try rephrasing it."
    
    if not response.endswith(('.', '!', '?')) and not response.endswith('\n'):
        response = response.rstrip() + '.'
    
    return response

def get_document_answer(question: str, document_chunks: List[str]) -> str:
    """Main function to get answers from document chunks with enhanced processing."""
    try:
        response = generate_response(question, document_chunks)
        final_response = validate_response_quality(response, question)
        return final_response
    except Exception as e:
        return f"Unable to process the question due to: {str(e)}"
