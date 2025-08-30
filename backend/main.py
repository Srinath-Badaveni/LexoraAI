from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware  # Missing import
from pydantic import BaseModel
from typing import List, Dict, Any  # Added Dict and Any
from utils.splitter import semantic_split
from utils.llm_chain import generate_response
import requests
import fitz
import asyncio
import json  # Added json import
import uuid  # Added uuid import
from datetime import datetime  # Added datetime import

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# In-memory storage for notebooks (in production, use a database)
notebooks_storage = {}

class QueryRequest(BaseModel):
    documents: str
    questions: List[str]

class FileQueryRequest(BaseModel):
    questions: List[str]

# Updated request model for single question
class NotebookQueryRequest(BaseModel):
    notebook_id: str
    question: str  # Changed from questions: List[str] to question: str

class NotebookResponse(BaseModel):
    notebook_id: str
    title: str
    content: str
    questions_answers: List[Dict[str, str]]
    created_at: str
    pdf_filename: str

# Updated response model for single question
class NotebookAnswerResponse(BaseModel):
    notebook_id: str
    question: str
    answer: str
    question_id: int
    total_questions: int
    updated_at: str

# Helper function to process chunks with LLM
async def process_chunk_with_llm_async(prompt, chunks):
    """Process a single chunk with LLM asynchronously"""
    return generate_response(prompt, chunks)

@app.post("/hackrx/run")
async def run_rag(request: Request, body: QueryRequest):
    # token = request.headers.get("Authorization", "")
    # if token != "Bearer 2d42fd7d38f866414d839e960974157a2da00333865223973f728105760fe343":
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        response = requests.get(body.documents)
        response.raise_for_status()
        pdf_bytes = response.content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error downloading document: {e}")

    pdf_text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            pdf_text += page.get_text()

    chunks = semantic_split(pdf_text)
    full_context = " ".join(chunks)

    # Prepare prompts and pass document chunks
    prompts_and_chunks = [
        (f"Based on the following document, answer the question:\n\nDocument:\n{full_context}\n\nQuestion:\n{q}", chunks)
        for q in body.questions
    ]

    # Create tasks with chunks
    responses = [await process_chunk_with_llm_async(prompt, chunks) for prompt, chunks in prompts_and_chunks]

    # Return only the list of answers
    return {
        "answers": responses,
    }

@app.post("/hackrx/run-file")
async def run_rag_with_file(
    request: Request,
    file: UploadFile = File(...),
    questions: str = None  # We'll parse this as JSON
):
    # token = request.headers.get("Authorization", "")
    # if token != "Bearer 2d42fd7d38f866414d839e960974157a2da00333865223973f728105760fe343":
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # Read the uploaded file
        pdf_bytes = await file.read()

        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # Parse questions from form data or query parameter
        if not questions:
            raise HTTPException(status_code=400, detail="Questions parameter is required")

        try:
            questions_list = json.loads(questions)
            if not isinstance(questions_list, list):
                raise ValueError("Questions must be a list")
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid questions format: {e}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")

    try:
        # Extract text from PDF
        pdf_text = ""
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page in doc:
                pdf_text += page.get_text()

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")

        chunks = semantic_split(pdf_text)
        full_context = " ".join(chunks)

        # Prepare prompts and pass document chunks
        prompts_and_chunks = [
            (f"Based on the following document, answer the question:\n\nDocument:\n{full_context}\n\nQuestion:\n{q}", chunks)
            for q in questions_list
        ]

        # Create tasks with chunks
        responses = [await process_chunk_with_llm_async(prompt, chunks) for prompt, chunks in prompts_and_chunks]

        # Return only the list of answers
        return {
            "answers": responses,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {e}")

@app.post("/hackrx/create-notebook", response_model=NotebookResponse)
async def create_notebook(
    request: Request,
    file: UploadFile = File(...)
):
    """
    Create a new notebook from PDF
    This endpoint:
    1. Takes a PDF file
    2. Extracts text from PDF
    3. Creates a notebook with PDF content and space for future Q&A
    4. Returns the notebook ID and initial info
    """
    try:
        # Read and validate PDF
        pdf_bytes = await file.read()
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # Extract text from PDF
        pdf_text = ""
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for page in doc:
                pdf_text += page.get_text()

        if not pdf_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")

        # Create chunks for future use
        chunks = semantic_split(pdf_text)

        # Create notebook
        notebook_id = str(uuid.uuid4())
        notebook_title = f"Notebook from {file.filename}"

        # Store notebook with empty Q&A array
        notebook = {
            "notebook_id": notebook_id,
            "title": notebook_title,
            "content": pdf_text,
            "chunks": chunks,  # Store chunks for future queries
            "questions_answers": [],  # Empty array for future Q&A
            "created_at": datetime.now().isoformat(),
            "pdf_filename": file.filename
        }

        notebooks_storage[notebook_id] = notebook

        return NotebookResponse(
            notebook_id=notebook_id,
            title=notebook_title,
            content=pdf_text[:1000] + "..." if len(pdf_text) > 1000 else pdf_text,  # Truncate for response
            questions_answers=[],  # Empty array in response
            created_at=notebook["created_at"],
            pdf_filename=file.filename
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating notebook: {e}")

@app.post("/hackrx/query-notebook", response_model=NotebookAnswerResponse)
async def query_notebook(request: Request, body: NotebookQueryRequest):
    """
    Updated endpoint: Query an existing notebook with a single question
    
    This endpoint:
    1. Takes a notebook ID and a single question
    2. Retrieves the stored notebook content from backend storage
    3. Processes the question using the existing RAG logic
    4. Updates the notebook with the new Q&A pair
    5. Returns the answer along with updated notebook info
    """
    try:
        # Debug logging
        print(f"Received request for notebook_id: {body.notebook_id}")
        print(f"Question: {body.question}")
        print(f"Available notebooks: {list(notebooks_storage.keys())}")

        # Check if notebook exists - Fixed the condition
        if body.notebook_id not in notebooks_storage:
            raise HTTPException(status_code=404, detail=f"Notebook not found. Available notebooks: {list(notebooks_storage.keys())}")

        # Retrieve notebook from backend storage
        notebook = notebooks_storage[body.notebook_id]
        print(f"Notebook retrieved: {notebook['title']}")

        # Use stored chunks for processing (retrieved from backend)
        chunks = notebook["chunks"]
        full_context = " ".join(chunks)
        
        print(f"Full context length: {len(full_context)}")
        print(f"Processing question: {body.question}")

        # Process the single question using existing RAG logic
        prompt = f"""Answer the following question using ONLY the provided document content. 
Be direct and concise. Do not include phrases like 'Based on the document' or 'The document states'.
For 'what is' questions: Give a clear, single-sentence definition.
For 'list' or 'what are' questions: Provide a comma-separated list.
For questions asking for X lines/points: Limit the answer to exactly that many points.
For 'who' questions: State only the relevant person/organization.
Remove any section numbers, titles, or notes markers.

Question:
{body.question}"""
        
        # Generate response with context
        answer = generate_response(prompt, chunks)
        print(f"Generated:{answer}")

        # Create Q&A pair with unique ID
        current_time = datetime.now().isoformat()
        question_id = len(notebook.get("questions_answers", [])) + 1
        
        qa_pair = {
            "question": body.question,
            "answer": answer,
            "question_id": question_id,
            "created_at": current_time
        }

        # Ensure questions_answers exists in notebook
        if "questions_answers" not in notebook:
            notebook["questions_answers"] = []

        # Update the notebook with the new Q&A pair
        notebook["questions_answers"].append(qa_pair)
        notebooks_storage[body.notebook_id] = notebook

        print(f"Updated notebook with Q&A pair. Total questions: {len(notebook['questions_answers'])}")

        # Prepare response
        return NotebookAnswerResponse(
            notebook_id=body.notebook_id,
            question=body.question,
            answer=answer,
            question_id=question_id,
            total_questions=len(notebook["questions_answers"]),
            updated_at=current_time
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in query_notebook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error querying notebook: {str(e)}")

@app.get("/hackrx/notebooks")
async def list_notebooks():
    """Get list of all notebooks"""
    try:
        notebook_list = []
        for notebook_id, notebook in notebooks_storage.items():
            notebook_list.append({
                "notebook_id": notebook_id,
                "title": notebook["title"],
                "created_at": notebook["created_at"],
                "pdf_filename": notebook["pdf_filename"],
                "questions_count": len(notebook.get("questions_answers", []))
            })
        
        print(f"Returning {len(notebook_list)} notebooks")
        return {"notebooks": notebook_list}
    except Exception as e:
        print(f"Error listing notebooks: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing notebooks: {str(e)}")

@app.get("/hackrx/notebooks/{notebook_id}")
async def get_notebook(notebook_id: str):
    """Get a specific notebook by ID"""
    try:
        if notebook_id not in notebooks_storage:
            raise HTTPException(status_code=404, detail="Notebook not found")

        notebook = notebooks_storage[notebook_id]
        return {
            "notebook_id": notebook_id,
            "title": notebook["title"],
            "content": notebook["content"],
            "chunks": notebook["chunks"],
            "questions_answers": notebook.get("questions_answers", []),
            "created_at": notebook["created_at"],
            "pdf_filename": notebook["pdf_filename"],
            "total_questions": len(notebook.get("questions_answers", []))
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving notebook: {str(e)}")

@app.get("/hackrx/notebooks/{notebook_id}/questions")
async def get_notebook_questions(notebook_id: str):
    """Get all questions and answers for a specific notebook"""
    try:
        if notebook_id not in notebooks_storage:
            raise HTTPException(status_code=404, detail="Notebook not found")
        
        notebook = notebooks_storage[notebook_id]
        
        return {
            "notebook_id": notebook_id,
            "title": notebook["title"],
            "pdf_filename": notebook["pdf_filename"],
            "questions_answers": notebook.get("questions_answers", []),
            "total_questions": len(notebook.get("questions_answers", [])),
            "created_at": notebook["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving notebook questions: {str(e)}")

@app.delete("/hackrx/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str):
    """Delete a notebook"""
    try:
        if notebook_id not in notebooks_storage:
            raise HTTPException(status_code=404, detail="Notebook not found")

        del notebooks_storage[notebook_id]
        return {"message": "Notebook deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notebook: {str(e)}")

@app.get("/")
async def root():
    return {"message": "RAG API with Notebook functionality is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "notebooks_count": len(notebooks_storage)}

# Debug endpoint to check notebooks storage
@app.get("/hackrx/debug/notebooks")
async def debug_notebooks():
    """Debug endpoint to see all notebooks in storage"""
    return {
        "notebooks_storage": {k: {
            "notebook_id": v.get("notebook_id"),
            "title": v.get("title"),
            "pdf_filename": v.get("pdf_filename"),
            "questions_count": len(v.get("questions_answers", [])),
            "created_at": v.get("created_at")
        } for k, v in notebooks_storage.items()},
        "total_notebooks": len(notebooks_storage)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
