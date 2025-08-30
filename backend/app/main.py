from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.lifecyle import lifespan
from app.routes.api_router import api_router
from app.settings import settings

app = FastAPI(
    title="Todo API",
    description="A simple ToDo API built with FastAPI and SQLModel",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Health(BaseModel): 
    message: str

@app.get("/", tags=["main"], response_model=Health, summary="Health Route", description="This is a health route for checking server status.")
def read_root():
    return {"message": "Hello World!"}

app.include_router(api_router)