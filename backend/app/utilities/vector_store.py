from typing import List

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
VECTOR_SIZE = 1024
pg_engine = PGEngine.from_engine(engine=engine)

# noinspection PyArgumentList
embedding = CohereEmbeddings(model="embed-english-v3.0", cohere_api_key=settings.COHERE_API_KEY or "placeholder_cohere_key")

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
        print(f"Failed to create vector store table: {e}")
        pass


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
    async with engine.connect() as conn:
        await conn.execute(text(query), {
            "file_ids": file_ids
        })
        await conn.commit()
