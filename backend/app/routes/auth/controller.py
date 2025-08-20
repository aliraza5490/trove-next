from fastapi import APIRouter, Depends
from .service import AuthService
from ...utilities.tags import Tags
from ...models.user import User, UserLogin, UserCreate
from ...utilities.auth import get_user_from_token
from ...utilities.db import get_session

auth_router = APIRouter(prefix="/auth", tags=[Tags.users])


@auth_router.post("/register")
async def register(user: UserCreate, session = Depends(get_session)):
    return await AuthService.register(user, session)


@auth_router.post("/protected")
def protected(user: User = Depends(get_user_from_token)):
    return AuthService.protected(user)

@auth_router.post("/login")
async def login(user: UserLogin, session = Depends(get_session)):
    return await AuthService.login(user, session)
