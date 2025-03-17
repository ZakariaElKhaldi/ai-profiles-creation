"""
Document processor for extracting text from various file formats.
This module handles text extraction, chunking, and embedding generation
for different document types.
"""
import os
import re
import io
import logging
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add site-packages to path
python_path = Path(sys.executable).parent
site_packages = python_path / "Lib" / "site-packages"
if site_packages.exists():
    sys.path.append(str(site_packages))

try:
    import fitz  # PyMuPDF
except ImportError as e:
    logger.error(f"Error importing PyMuPDF: {e}")
    logger.info("Trying alternative import path...")
    try:
        from pymupdf import fitz
    except ImportError as e:
        logger.error(f"Failed to import PyMuPDF using alternative path: {e}")
        fitz = None

import docx
import csv
import pandas as pd
from typing import List, Dict, Any, Optional, Union

class DocumentProcessor:
    """Class for processing and extracting text from documents"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """Initialize the document processor
        
        Args:
            chunk_size: The size of text chunks in characters
            chunk_overlap: The overlap between consecutive chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Check if PDF processing is available
        self.pdf_available = fitz is not None
        
        self.supported_formats = {
            'txt': self._process_txt,
            'docx': self._process_docx,
            'csv': self._process_csv
        }
        
        # Only add PDF support if available
        if self.pdf_available:
            self.supported_formats['pdf'] = self._process_pdf
        
        logger.info(f"Initialized DocumentProcessor with supported formats: {list(self.supported_formats.keys())}")
    
    def process_document(self, file_content: bytes, filename: str) -> List[str]:
        """Process a document and extract text chunks
        
        Args:
            file_content: Binary content of the file
            filename: Name of the file with extension
            
        Returns:
            List of text chunks extracted from the document
        """
        file_ext = filename.split('.')[-1].lower()
        
        if file_ext not in self.supported_formats:
            if file_ext == 'pdf' and not self.pdf_available:
                raise ValueError("PDF processing is not available. PyMuPDF (fitz) failed to load.")
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        # Call the appropriate processing function based on file extension
        text = self.supported_formats[file_ext](file_content)
        
        # Chunk the extracted text
        return self._chunk_text(text)
    
    def _process_pdf(self, content: bytes) -> str:
        """Extract text from PDF file
        
        Args:
            content: Binary content of the PDF file
            
        Returns:
            Extracted text as a string
        """
        if not self.pdf_available:
            logger.error("PDF processing attempted but PyMuPDF is not available")
            return ""
            
        text = ""
        
        try:
            # Open the PDF from memory
            with fitz.open(stream=content, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return ""
        
        return text
    
    def _process_txt(self, content: bytes) -> str:
        """Extract text from a text file
        
        Args:
            content: Binary content of the text file
            
        Returns:
            Extracted text as a string
        """
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                return content.decode('latin-1')
            except Exception as e:
                print(f"Error processing text file: {str(e)}")
                return ""
    
    def _process_docx(self, content: bytes) -> str:
        """Extract text from DOCX file
        
        Args:
            content: Binary content of the DOCX file
            
        Returns:
            Extracted text as a string
        """
        text = ""
        
        try:
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            print(f"Error processing DOCX: {str(e)}")
            return ""
        
        return text
    
    def _process_csv(self, content: bytes) -> str:
        """Extract text from CSV file
        
        Args:
            content: Binary content of the CSV file
            
        Returns:
            Extracted text as a string
        """
        text = ""
        
        try:
            # Load CSV data
            csv_data = pd.read_csv(io.BytesIO(content))
            
            # Convert DataFrame to string representation
            text = csv_data.to_string(index=False)
        except Exception as e:
            print(f"Error processing CSV: {str(e)}")
            return ""
        
        return text
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks with overlap
        
        Args:
            text: The text to split into chunks
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        # Clean the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Split the text into chunks
        chunks = []
        start = 0
        
        while start < len(text):
            # Take a chunk of the specified size
            end = min(start + self.chunk_size, len(text))
            
            # If this isn't the first chunk and we're not at the end of the text,
            # try to find a good breaking point (space, period, etc.)
            if start > 0 and end < len(text):
                # Look for the last sentence break or space within the last 100 characters
                for i in range(end, max(end - 100, start), -1):
                    if text[i-1] in '.!? ' and text[i:i+1] != '':
                        end = i
                        break
            
            # Add the chunk to our list
            chunks.append(text[start:end].strip())
            
            # Move the start position, taking overlap into account
            start = end - self.chunk_overlap if end < len(text) else end
        
        return chunks 