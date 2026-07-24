import os
from typing import List

from langchain_core.embeddings import Embeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_cohere import CohereEmbeddings
from langchain_postgres import PGVectorStore
from langchain_postgres.v2.engine import PGEngine, Column
from langchain_text_splitters.character import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import text

from app.settings import settings

engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    echo=True,
    future=True,
)

TABLE_NAME = "vector_store"
pg_engine = PGEngine.from_engine(engine=engine)


class FallbackEmbeddings(Embeddings):
    """Dummy fallback embeddings used when no external embedding API key is provided."""
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[0.0] * 768 for _ in texts]

    def embed_query(self, text: str) -> List[float]:
        return [0.0] * 768

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[0.0] * 768 for _ in texts]

    async def aembed_query(self, text: str) -> List[float]:
        return [0.0] * 768


google_key = getattr(settings, "GOOGLE_AI_STUDIO_API_KEY", None) or os.getenv("GOOGLE_AI_STUDIO_API_KEY")
cohere_key = getattr(settings, "COHERE_API_KEY", None) or os.getenv("COHERE_API_KEY")

if google_key and google_key.strip():
    embedding = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=google_key
    )
    VECTOR_SIZE = 768
elif cohere_key and cohere_key.strip():
    embedding = CohereEmbeddings(
        model="embed-english-v3.0",
        cohere_api_key=cohere_key
    )
    VECTOR_SIZE = 1024
else:
    embedding = FallbackEmbeddings()
    VECTOR_SIZE = 768

text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)


async def create_vector_store_table():
    try:
        await pg_engine.ainit_vectorstore_table(
            table_name=TABLE_NAME,
            vector_size=VECTOR_SIZE,
            overwrite_existing=False,
            metadata_columns=[
                Column("type", "text"),
                Column("file_id", "text"),
                Column("chat_id", "text"),
            ]
        )
    except Exception as e:
        print(f"[VectorStore] Table creation warning: {e}")


async def get_vector_store() -> PGVectorStore:
    store = await PGVectorStore.create(
        engine=pg_engine,
        table_name=TABLE_NAME,
        embedding_service=embedding,
        metadata_columns=["type", "file_id", "chat_id"],
        metadata_json_column="metadata",
    )
    return store


async def delete_file_embeddings(file_ids: List[str]):
    query = f"""
            DELETE FROM public.{TABLE_NAME}
            WHERE "file_id" = ANY(:file_ids)
        """
    try:
        async with engine.connect() as conn:
            await conn.execute(text(query), {
                "file_ids": file_ids
            })
            await conn.commit()
    except Exception as e:
        print(f"[VectorStore] Failed to delete embeddings: {e}")
