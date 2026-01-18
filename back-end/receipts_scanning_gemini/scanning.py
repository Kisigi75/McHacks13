import os
import json
from google import genai
from google.genai import types

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load key
key_path = os.path.join(BASE_DIR, "gemini_key.txt")
with open(key_path, "r") as f:
    API_KEY = f.read().strip()

client = genai.Client(api_key=API_KEY)

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "merchant": {"type": "STRING"},
        "date": {"type": "STRING"},
        "total": {"type": "NUMBER"},
        "currency": {"type": "STRING"},
        "items": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "quantity": {"type": "NUMBER"},
                    "price": {"type": "NUMBER"}
                },
                "required": ["name"]
            }
        }
    },
    "required": ["merchant", "total", "items"]
}

def extract_text_from_response(txt_response):
    # New SDK sometimes doesn't fill resp.text; extract from candidates
    if getattr(txt_response, "text", None):
        return txt_response.text

    try:
        parts = txt_response.candidates[0].content.parts
        # join any text parts
        return "".join(getattr(p, "text", "") for p in parts if getattr(p, "text", None))
    except Exception:
        return ""

def scan_receipt(bytes, type):
    resp = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            types.Part.from_bytes(data=bytes, mime_type=type),
            "Analyze this receipt and extract the data into the specified JSON format."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
        ),
    )

    raw = extract_text_from_response(resp).strip()
    if not raw:
        raise RuntimeError(f"No text returned. Raw response: {resp}")

    return json.loads(raw)


