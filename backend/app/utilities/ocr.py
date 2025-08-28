# DOCX
from docx import Document

def extract_docx(path):
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
from pptx import Presentation

def extract_pptx(path):
    prs = Presentation(path)
    texts = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text.strip():
                texts.append(shape.text.strip())
    return "\n".join(texts)


# PDF
import pdfplumber
from pdf2image import convert_from_path
import pytesseract

def extract_pdf(path):
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text.append(page_text)
            else:
                # OCR fallback for scanned pages
                img = convert_from_path(path, first_page=page.page_number, last_page=page.page_number)[0]
                text.append(pytesseract.image_to_string(img, lang="eng"))
    return "\n".join(text)


# Images
from PIL import Image

def extract_image(path):
    img = Image.open(path)
    return pytesseract.image_to_string(img, lang="eng")


# HTML
from bs4 import BeautifulSoup

def extract_html(path):
    with open(path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
    return soup.get_text(separator="\n", strip=True)


# Main Function
import os

def extract_text(path):
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
