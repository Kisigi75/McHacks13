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
        "category": {
            "type": "STRING",
            "enum": ["groceries", "restaurant", "travel", "gift", "shopping", "transport", "health", "other"]
        },
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
            "Also choose the best 'category' from the allowed list based on merchant/items."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
        ),
    )

    raw = extract_text_from_response(resp).strip()
    data = json.loads(raw)

    data = normalize_strings(data)
    print("CLEANED ITEMS:", data.get("items"))

    return data

def fix_code_cleaning(s: str) -> str:
    if not isinstance(s, str):
        return s
    try:
        return s.encode("latin1").decode("utf-8")
    except Exception:
        return s
    
def normalize_strings(obj):
    if isinstance(obj, dict):
        return {k: normalize_strings(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize_strings(v) for v in obj]
    if isinstance(obj, str):
        return fix_code_cleaning(obj)
    return obj




