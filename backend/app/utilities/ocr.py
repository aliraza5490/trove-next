"""Utilities for extracting text content from common document formats.

Supported formats:
- DOCX (paragraphs and tables)
- PPTX (text-containing shapes)
- PDF (native text via pdfplumber with OCR fallback using Tesseract)
- Raster images (OCR via Tesseract)
- HTML (stripped text via BeautifulSoup)

Notes:
- OCR requires Tesseract to be installed and accessible to pytesseract.
- PDF OCR fallback uses pdf2image, which requires poppler utilities.
"""
import os
from bs4 import BeautifulSoup
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import pdfplumber
from pptx import Presentation
from docx import Document

# DOCX


def extract_docx(path):
    """Extract plain text from a DOCX file.

    Args:
        path (str): Path to a .docx file.

    Returns:
        str: Newline-separated text from paragraphs and table cells.
    """
    doc = Document(path)
    texts = []
    for para in doc.paragraphs:
        if para.text.strip():
            texts.append(para.text.strip())
    # tables too
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    texts.append(cell.text.strip())
    return "\n".join(texts)


# PPTX


def extract_pptx(path):
    """Extract plain text from a PPTX presentation.

    Iterates slides and collects text from shapes that expose a 'text' attribute.

    Args:
        path (str): Path to a .pptx file.

    Returns:
        str: Newline-separated text from all slides.
    """
    prs = Presentation(path)
    texts = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                texts.append(shape.text.strip())
    return "\n".join(texts)


# PDF


def extract_pdf(path):
    """Extract text from a PDF.

    Attempts native text extraction per page via pdfplumber. If a page has
    no extractable text, falls back to OCR by rasterizing that page and
    running Tesseract.

    Args:
        path (str): Path to a .pdf file.

    Returns:
        str: Newline-separated text for all pages.

    Notes:
        - OCR fallback requires Tesseract and poppler (for pdf2image).
        - Language is fixed to English ('eng').
    """
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text.append(page_text)
            else:
                # OCR fallback for scanned pages
                img = convert_from_path(
                    path, first_page=page.page_number, last_page=page.page_number
                )[0]
                text.append(pytesseract.image_to_string(img, lang="eng"))
    return "\n".join(text)


# Images


def extract_image(path):
    """OCR text from an image file.

    Args:
        path (str): Path to an image (jpg, jpeg, png, tiff, bmp, gif).

    Returns:
        str: Text recognized by Tesseract (English).
    """
    img = Image.open(path)
    return pytesseract.image_to_string(img, lang="eng")


# HTML


def extract_html(path):
    """Extract readable text content from an HTML file.

    Uses BeautifulSoup to strip tags and return visible text.

    Args:
        path (str): Path to an .html or .htm file.

    Returns:
        str: Text content with newlines separating blocks.
    """
    with open(path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
    return soup.get_text(separator="\n", strip=True)


# Main Function


def extract_text(path):
    """Dispatch text extraction based on file extension.

    Args:
        path (str): Absolute or relative path to an input file.

    Returns:
        str: Extracted text content.

    Raises:
        ValueError: If the file extension is not supported.
    """
    ext = os.path.splitext(path)[1].lower()

    if ext == ".docx":
        return extract_docx(path)
    elif ext == ".pptx":
        return extract_pptx(path)
    elif ext == ".pdf":
        return extract_pdf(path)
    elif ext in [".jpg", ".jpeg", ".png", ".tiff", ".bmp", ".gif"]:
        return extract_image(path)
    elif ext in [".html", ".htm"]:
        return extract_html(path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
