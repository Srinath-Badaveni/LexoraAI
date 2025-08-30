# utils/splitter.py

import re
from typing import List

def semantic_split(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """
    Split text into semantic chunks based on sentences and paragraphs.
    
    Args:
        text (str): The input text to split
        chunk_size (int): Maximum size of each chunk in characters
        overlap (int): Number of characters to overlap between chunks
        
    Returns:
        List[str]: List of text chunks
    """
    if not text or not text.strip():
        return []
    
    # Clean the text
    text = re.sub(r'\n+', '\n', text)  # Remove multiple newlines
    text = re.sub(r'\s+', ' ', text)   # Normalize whitespace
    text = text.strip()
    
    # If text is smaller than chunk_size, return as single chunk
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # Calculate end position
        end = start + chunk_size
        
        if end >= len(text):
            # Last chunk
            chunks.append(text[start:].strip())
            break
        
        # Try to find a good breaking point
        break_point = find_break_point(text, start, end)
        
        if break_point == -1:
            # No good break point found, use the end position
            break_point = end
        
        chunk = text[start:break_point].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = max(break_point - overlap, start + 1)
        
        # Prevent infinite loop
        if start >= break_point:
            start = break_point
    
    return [chunk for chunk in chunks if chunk.strip()]

def find_break_point(text: str, start: int, end: int) -> int:
    """
    Find the best point to break the text, preferring sentence or paragraph boundaries.
    
    Args:
        text (str): The full text
        start (int): Start position of the current chunk
        end (int): End position of the current chunk
        
    Returns:
        int: Position to break the text, or -1 if no good break point found
    """
    # Look for sentence endings near the end
    sentence_endings = ['.', '!', '?']
    
    # Search backwards from end for sentence ending
    for i in range(end - 1, start + len(text) // 4, -1):  # Don't go too far back
        if text[i] in sentence_endings and i + 1 < len(text):
            # Check if next character is whitespace or end of text
            if text[i + 1].isspace() or i + 1 == len(text):
                return i + 1
    
    # If no sentence ending found, look for paragraph breaks
    for i in range(end - 1, start + len(text) // 4, -1):
        if text[i] == '\n':
            return i + 1
    
    # If no paragraph break, look for other punctuation
    other_punctuation = [';', ':', ',']
    for i in range(end - 1, start + len(text) // 2, -1):
        if text[i] in other_punctuation and i + 1 < len(text):
            if text[i + 1].isspace():
                return i + 1
    
    # If no punctuation, look for word boundaries
    for i in range(end - 1, start + len(text) // 2, -1):
        if text[i].isspace():
            return i + 1
    
    # No good break point found
    return -1

def smart_chunk_text(text: str, max_chunk_size: int = 1500, min_chunk_size: int = 200) -> List[str]:
    """
    Advanced text chunking that tries to maintain semantic coherence.
    
    Args:
        text (str): Input text to chunk
        max_chunk_size (int): Maximum characters per chunk
        min_chunk_size (int): Minimum characters per chunk
        
    Returns:
        List[str]: List of semantically coherent text chunks
    """
    if not text or not text.strip():
        return []
    
    # Split by double newlines first (paragraphs)
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If paragraph alone is too big, split it further
        if len(paragraph) > max_chunk_size:
            # Add current chunk if it exists
            if current_chunk and len(current_chunk) >= min_chunk_size:
                chunks.append(current_chunk.strip())
                current_chunk = ""
            
            # Split the large paragraph
            para_chunks = semantic_split(paragraph, max_chunk_size, 50)
            chunks.extend(para_chunks)
        else:
            # Check if adding this paragraph would exceed max size
            if len(current_chunk) + len(paragraph) + 2 > max_chunk_size:
                if current_chunk and len(current_chunk) >= min_chunk_size:
                    chunks.append(current_chunk.strip())
                current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
    
    # Add the last chunk
    if current_chunk and len(current_chunk) >= min_chunk_size:
        chunks.append(current_chunk.strip())
    elif current_chunk and chunks:
        # If last chunk is too small, merge with previous
        chunks[-1] += "\n\n" + current_chunk
    elif current_chunk:
        # If it's the only chunk, keep it even if small
        chunks.append(current_chunk.strip())
    
    return [chunk for chunk in chunks if chunk.strip()]