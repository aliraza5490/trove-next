import json
from typing import AsyncGenerator, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.agent.core.provider import get_llm_model
from app.agent.agents.read.tools.document_rag import search_document_rag


async def run_read_agent(
    message: str,
    history_messages: list,
    chat_id: Optional[str] = None,
    context_text: str = "",
    upload_context: str = "",
    attachments_media: list = None,
) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'status', 'content': 'Selected Read (Document Agent)...', 'agent': 'read'})}\n\n"
    yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing uploaded documents and performing RAG search...', 'agent': 'read', 'tool': 'document_rag'})}\n\n"

    doc_rag_context = await search_document_rag(query=message, chat_id=chat_id, k=5)

    llm = get_llm_model(temperature=0.2)
    system_prompt = (
        "You are Read, Trove's Document Agent. Your purpose is to analyze, summarize, extract structured information from, "
        "and answer questions about uploaded documents and attachments. "
        "Provide thorough, precise answers grounded in the provided document content."
    )
    
    combined_docs = f"{context_text}\n{upload_context}\n{doc_rag_context}".strip()
    if combined_docs:
        system_prompt += f"\n\nExtracted Document Content:\n{combined_docs}"

    lc_messages = [SystemMessage(content=system_prompt)]
    for msg in history_messages:
        role = msg.get("role", "user").lower()
        content = msg.get("message") or msg.get("content") or ""
        if role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))

    user_content_parts = [{"type": "text", "text": message}]
    if attachments_media:
        for item in attachments_media:
            g_uri = item.get("google_uri") or item.get("googleUri")
            m_type = item.get("mime_type") or item.get("mimeType") or "application/octet-stream"
            if g_uri:
                user_content_parts.append({
                    "type": "media",
                    "file_uri": g_uri,
                    "mime_type": m_type,
                })

    latest_human = (
        HumanMessage(content=user_content_parts)
        if len(user_content_parts) > 1
        else HumanMessage(content=message)
    )
    lc_messages.append(latest_human)

    async for chunk in llm.astream(lc_messages):
        if chunk.content:
            yield f"data: {json.dumps({'type': 'message', 'content': chunk.content})}\n\n"
