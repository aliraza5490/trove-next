from typing import Optional
from app.utilities.vector_store import get_vector_store


async def search_document_rag(query: str, chat_id: Optional[str] = None, k: int = 5) -> str:
    store = await get_vector_store()
    results = []
    
    try:
        context_docs = await store.asimilarity_search(query=query, k=k, filter={"type": "upload"})
        for doc in context_docs:
            if doc.page_content:
                results.append(doc.page_content)
    except Exception as e:
        print(f"[DocumentRAG] Knowledge base search failed: {e}")

    if chat_id:
        try:
            attachment_docs = await store.asimilarity_search(
                query=query, k=k, filter={"type": "attachment", "chat_id": str(chat_id)}
            )
            for doc in attachment_docs:
                if doc.page_content:
                    results.append(doc.page_content)
        except Exception as e:
            print(f"[DocumentRAG] Attachment search failed: {e}")

    return "\n\n".join(results)
