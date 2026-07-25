import json
from typing import AsyncGenerator
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.agent.core.provider import get_llm_model
from app.agent.agents.recall.tools.recall_search import recall_past_messages


async def run_recall_agent(
    message: str,
    history_messages: list,
    context_text: str = "",
    upload_context: str = "",
    attachments_media: list = None,
) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'status', 'content': 'Selected Recall (Knowledge Agent)...', 'agent': 'recall'})}\n\n"
    yield f"data: {json.dumps({'type': 'status', 'content': 'Searching historical chat memory & vector store...', 'agent': 'recall', 'tool': 'vector_memory_search'})}\n\n"

    past_memory_context = await recall_past_messages(query=message, k=5)
    
    llm = get_llm_model(temperature=0.3)
    system_prompt = (
        "You are Recall, Trove's Knowledge Agent. Your purpose is to search and reason over the user's previous conversations, "
        "retrieve past decisions, reconnect ideas discussed in past sessions, and recover lost context. "
        "Synthesize your findings cleanly in GitHub-flavored Markdown."
    )
    
    combined_context = f"{context_text}\n{upload_context}\n{past_memory_context}".strip()
    if combined_context:
        system_prompt += f"\n\nRetrieved Historical Context:\n{combined_context}"

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
