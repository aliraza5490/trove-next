from fastapi import APIRouter
from .auth.controller import auth_router
from ..settings import settings

api_router = APIRouter(prefix=settings.API_V1_STR)

api_router.include_router(auth_router)



