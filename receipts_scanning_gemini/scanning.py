import json
from google import genai 
from google.genai import types
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


key_path = os.path.join(BASE_DIR, "gemini_key.txt")
with open(key_path, "r") as f:
    API_KEY = f.read().strip()


# Initialize the client
# Ensure you have set the API_KEY environment variable
client = genai.Client(api_key=API_KEY)

def scan_receipt(image_path):
    with open(image_path, "rb") as f:
        image_data = f.read()

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=[
            types.Part.from_bytes(data=image_data, mime_type="image/jpeg"),
            "Analyze this receipt and extract the data into the specified JSON format."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
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
                            }
                        }
                    }
                },
                "required": ["merchant", "total", "items"]
            }
        )
    )
    return response.text

# Example usage
result = scan_receipt("receipts_scanning_gemini/ReceiptSwiss.jpg")
print(result)