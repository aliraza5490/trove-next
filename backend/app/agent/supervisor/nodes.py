import json
from typing import AsyncGenerator
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.agent.core.provider import get_llm_model
from app.agent.core.utils import extract_text_content


async def run_default_agent(
    message: str,
    history_messages: list,
    context_text: str = "",
    upload_context: str = "",
    attachments_media: list = None,
) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'status', 'content': 'Using Default Assistant...', 'agent': 'default'})}\n\n"
    
    llm = get_llm_model(temperature=0.7)
    system_prompt = (
        "Your name is Trove. You are an intelligent, helpful AI assistant. "
        "Respond in clear, well-structured GitHub-flavored Markdown."
    )
    if context_text or upload_context:
        system_prompt += f"\n\nRelevant Context:\n{context_text}\n{upload_context}"

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
            chunk_text = extract_text_content(chunk.content)
            if chunk_text:
                yield f"data: {json.dumps({'type': 'message', 'content': chunk_text})}\n\n"
