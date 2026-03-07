import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

try:
    print(f"Testing with API Key: {api_key[:5]}...{api_key[-5:]}")
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Hello"
    )
    print("SUCCESS: ", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
