import json
from typing import AsyncGenerator
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent

from app.agent.core.provider import get_llm_model
from app.agent.agents.scout.tools.web_search import get_web_search_tool


async def run_scout_agent(
    message: str,
    history_messages: list,
    web_search: bool = True,
    context_text: str = "",
    upload_context: str = "",
    attachments_media: list = None,
) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'status', 'content': 'Selected Scout (Online Research Agent)...', 'agent': 'scout'})}\n\n"

    llm = get_llm_model(temperature=0.3)
    tools = get_web_search_tool()

    if tools:
        yield f"data: {json.dumps({'type': 'status', 'content': 'Searching the web with Tavily Search...', 'agent': 'scout', 'tool': 'tavily_search'})}\n\n"
        agent = create_react_agent(llm, tools=tools)
    else:
        agent = None

    system_prompt = (
        "You are Scout, Trove's Online Research Agent. Your purpose is to research information across the web, "
        "compare products/technologies/companies/ideas, gather information from multiple sources, summarize research findings, "
        "and provide clear source citations and insights. Structure your answers in clean GitHub-flavored Markdown."
    )
    if context_text or upload_context:
        system_prompt += f"\n\nContext:\n{context_text}\n{upload_context}"

    lc_messages = []
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

    if agent:
        prompt_messages = [SystemMessage(content=system_prompt)] + lc_messages
        async for step, info in agent.astream({"messages": prompt_messages}, stream_mode="messages"):
            if info.get("langgraph_node") == "agent" and (chunk := step.text()):
                yield f"data: {json.dumps({'type': 'message', 'content': chunk})}\n\n"
    else:
        full_messages = [SystemMessage(content=system_prompt)] + lc_messages
        async for chunk in llm.astream(full_messages):
            if chunk.content:
                yield f"data: {json.dumps({'type': 'message', 'content': chunk.content})}\n\n"
