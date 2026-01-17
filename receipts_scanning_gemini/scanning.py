import json
from google import genai 

with open("gemini_key.txt", "r") as f:
    api_key = f.read().strip()