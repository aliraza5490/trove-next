from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.utilities.db import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup: Initialize before app starts
    await create_db_and_tables()
    yield  # This is crucial - it yields control back to FastAPI
    # Cleanup: Code after this will run when app shuts down
    # You can add cleanup code here if needed
    pass