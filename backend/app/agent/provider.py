import os
from langchain_core.language_models import BaseChatModel
from langchain_groq import ChatGroq
from app.settings import settings


def get_llm_model(temperature: float = 0.7, model_name: str = "openai/gpt-oss-20b") -> BaseChatModel:
    groq_api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    if groq_api_key:
        return ChatGroq(
            model=model_name,
            temperature=temperature,
            api_key=groq_api_key,
            max_retries=2,
        )

    if google_api_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=temperature,
            google_api_key=google_api_key,
        )

    # Fallback to Groq if key exists in settings
    return ChatGroq(
        model=model_name,
        temperature=temperature,
        api_key=settings.GROQ_API_KEY or "placeholder_key",
        max_retries=2,
    )
