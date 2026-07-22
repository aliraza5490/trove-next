import os
from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from app.settings import settings


def get_llm_model(temperature: float = 0.7, model_name: str = "gemini-2.5-flash") -> BaseChatModel:
    google_api_key = (
        getattr(settings, "GOOGLE_AI_STUDIO_API_KEY", None)
        or os.getenv("GOOGLE_AI_STUDIO_API_KEY")
    )

    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        google_api_key=google_api_key,
    )

