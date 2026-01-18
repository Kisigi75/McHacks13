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

def extract_text_from_response(resp) -> str:
    # New SDK sometimes doesn't fill resp.text; extract from candidates
    if getattr(resp, "text", None):
        return resp.text

    try:
        parts = resp.candidates[0].content.parts
        # join any text parts
        return "".join(getattr(p, "text", "") for p in parts if getattr(p, "text", None))
    except Exception:
        return ""

def scan_receipt(image_filename: str):
    image_path = os.path.join(BASE_DIR, image_filename)

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with open(image_path, "rb") as f:
        image_data = f.read()

    resp = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
            "Analyze this receipt and extract the data into the specified JSON format."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
        ),
    )

    raw = extract_text_from_response(resp).strip()

    if not raw:
        # helpful debug if model returned something unexpected
        raise RuntimeError(f"No text returned. Raw response: {resp}")

    # Parse + return as dict (nice for later DB insert)
    return json.loads(raw)

if __name__ == "__main__":
    result = scan_receipt("PHOTO-2026-01-17-21-56-38.jpg")
    print(json.dumps(result, indent=2))
