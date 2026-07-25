from app.utilities.vector_store import get_vector_store


async def recall_past_messages(query: str, k: int = 5) -> str:
    try:
        store = await get_vector_store()
        docs = await store.asimilarity_search(query=query, k=k)
        if not docs:
            return ""
        return "\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"[RecallSearchTool] Memory search failed: {e}")
        return ""
