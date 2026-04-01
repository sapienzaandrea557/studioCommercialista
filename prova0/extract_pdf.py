
import pypdf
import os
import sys

# Ensure output is UTF-8
sys.stdout.reconfigure(encoding='utf-8')

def extract_text(pdf_path):
    try:
        reader = pypdf.PdfReader(pdf_path)
        print(f"Total pages: {len(reader.pages)}")
        text = ""
        for i, page in enumerate(reader.pages):
            extracted = page.extract_text()
            print(f"Page {i+1} extraction length: {len(extracted)}")
            text += extracted + "\n"
        return text
    except Exception as e:
        return f"Error: {str(e)}"

pdf_file = r"D:\studioCommercialista\miglioramenti\analizza.pdf"
if os.path.exists(pdf_file):
    print(extract_text(pdf_file))
else:
    print(f"File not found: {pdf_file}")
