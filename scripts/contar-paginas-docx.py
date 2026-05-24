from pathlib import Path
import sys

path = Path(__file__).resolve().parents[1] / "docs" / "Memoria-Velo.docx"
try:
    import win32com.client

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    doc = word.Documents.Open(str(path.resolve()))
    print(doc.ComputeStatistics(2))
    doc.Close(False)
    word.Quit()
except Exception as e:
    print("ERROR", e, file=sys.stderr)
    sys.exit(1)
