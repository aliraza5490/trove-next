from functools import reduce

from sqlmodel import select, func, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.file import File
from app.models.message import Message
from app.models.user import TokenData
from app.utilities.vector_store import TABLE_NAME


class StatsService:
    @classmethod
    async def get_stats(cls, user: TokenData, session: AsyncSession):
        try:
            all_files = await session.exec(select(File).where(File.user_id == user.id))
            all_files = all_files.all()
            total_messages = await session.exec(select(func.count(Message.id)).where(Message.user_id == user.id))
            total_docs = await session.exec(select(func.count()).select_from(text(f"{TABLE_NAME}")))

            return {
                "total_files": len(all_files),
                "total_docs": total_docs.one(),
                "total_messages": total_messages.one(),
                "storage": reduce(lambda acc, item: acc + item.file_size, all_files, 0),
            }
        except Exception as e:
            print(e)
            return {"total_files": 0, "total_docs": 0, "total_messages": 0, "storage": 0}
