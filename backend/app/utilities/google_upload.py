import os
import time
from typing import Optional
from app.settings import settings


def upload_file_to_google(file_path: str, mime_type: Optional[str] = None) -> Optional[str]:
    google_api_key = getattr(settings, "GOOGLE_AI_STUDIO_API_KEY", None) or os.getenv("GOOGLE_AI_STUDIO_API_KEY")
    if not google_api_key or not os.path.exists(file_path):
        return None

    try:
        from google import genai
        client = genai.Client(api_key=google_api_key)

        print(f"[GoogleGenAI] Uploading file to Google servers: {file_path}")
        uploaded = client.files.upload(
            file=file_path,
            config={"mime_type": mime_type} if mime_type else None
        )

        if not uploaded or not getattr(uploaded, "name", None):
            return None

        while hasattr(uploaded, "state") and getattr(uploaded.state, "name", "") == "PROCESSING":
            print(f"[GoogleGenAI] File processing at Google, waiting 1.5s...")
            time.sleep(1.5)
            uploaded = client.files.get(name=uploaded.name)

        google_uri = getattr(uploaded, "uri", None)
        print(f"[GoogleGenAI] File uploaded successfully to Google. URI: {google_uri}")
        return google_uri
    except Exception as err:
        print(f"[GoogleGenAI] Failed to upload file to Google GenAI: {err}")
        return None
