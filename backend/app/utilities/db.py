from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from ..settings import settings

# SQLModel setup
DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI
engine = create_async_engine(str(DATABASE_URL), echo=True,future=True)

# Create tables on startup
async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# Database dependency
async def get_session():
    # Prevent attribute expiration on commit to avoid implicit lazy-loads
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
