import sys
from pypdf import PdfReader

def extract_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    path = r"d:\studioCommercialista\miglioramenti\SEO-Report-f7f04a15fc6b540f61ebc697f3227606.pdf"
    print(extract_text(path))
