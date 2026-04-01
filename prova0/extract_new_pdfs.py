
import pypdf
import os
import sys

# Ensure output is UTF-8
sys.stdout.reconfigure(encoding='utf-8')

def extract_text(pdf_path):
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = f"\n--- PDF: {os.path.basename(pdf_path)} ---\n"
        for i, page in enumerate(reader.pages):
            text += f"\n[Page {i+1}]\n" + page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading {pdf_path}: {str(e)}"

miglioramenti_dir = r"D:\studioCommercialista\miglioramenti"
if not os.path.exists(miglioramenti_dir):
    print(f"Directory not found: {miglioramenti_dir}")
else:
    pdfs = [f for f in os.listdir(miglioramenti_dir) if f.endswith('.pdf')]
    if not pdfs:
        print("No PDF files found in miglioramenti directory.")
    else:
        for pdf in pdfs:
            print(extract_text(os.path.join(miglioramenti_dir, pdf)))
