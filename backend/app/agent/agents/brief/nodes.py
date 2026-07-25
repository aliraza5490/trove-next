import json
from typing import AsyncGenerator
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.agent.core.provider import get_llm_model


async def run_brief_agent(
    message: str,
    history_messages: list,
    context_text: str = "",
    upload_context: str = "",
    attachments_media: list = None,
) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'status', 'content': 'Selected Brief (Meeting Agent)...', 'agent': 'brief'})}\n\n"
    yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing meeting notes, decisions, and action items...', 'agent': 'brief', 'tool': 'transcript_extractor'})}\n\n"

    llm = get_llm_model(temperature=0.3)
    system_prompt = (
        "You are Brief, Trove's Meeting Agent. Your purpose is to turn meetings, transcripts, and notes into concise summaries "
        "and actionable outcomes. Always structure your responses with sections for:\n"
        "1. Executive Summary\n"
        "2. Key Decisions Made\n"
        "3. Action Items (Owner \| Task \| Deadline)\n"
        "4. Follow-up Recommendations\n\n"
        "Use GitHub-flavored Markdown tables and bullet points for maximum readability."
    )
    if context_text or upload_context:
        system_prompt += f"\n\nContext:\n{context_text}\n{upload_context}"

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
