from langchain_cohere import CohereEmbeddings
from langchain_postgres import PGVectorStore
from langchain_postgres.v2.engine import PGEngine
from langchain_text_splitters.character import RecursiveCharacterTextSplitter
from sqlalchemy.ext.asyncio import create_async_engine

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
embedding = CohereEmbeddings(model="embed-english-v3.0", cohere_api_key=settings.COHERE_API_KEY)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)

async def create_vector_store_table():
    await pg_engine.ainit_vectorstore_table(
        table_name=TABLE_NAME,
        vector_size=VECTOR_SIZE,
        overwrite_existing=True
    )


async def get_vector_store() -> PGVectorStore:
    store = await PGVectorStore.create(
        engine=pg_engine,
        table_name=TABLE_NAME,
        embedding_service=embedding,
    )
    return store
