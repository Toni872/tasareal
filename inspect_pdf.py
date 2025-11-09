from pathlib import Path
from pypdf import PdfReader

reader = PdfReader("Social_Posts_TasaReal.pdf")
for idx, page in enumerate(reader.pages, 1):
    text = page.extract_text() or "<sin texto>"
    print(f"--- Página {idx} ---")
    print(text[:400])
