from contextlib import asynccontextmanager

from fastapi import FastAPI
from langchain_core.vectorstores.base import VectorStore

from app.utilities.db import create_db_and_tables
from app.utilities.vector_store import create_vector_store_table, get_vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup: Initialize before app starts
    await create_db_and_tables()
    await create_vector_store_table()
    yield  # This is crucial - it yields control back to FastAPI
    # Cleanup: Code after this will run when app shuts down
    # You can add cleanup code here if needed
    pass