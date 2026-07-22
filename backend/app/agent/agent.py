import json
from typing import AsyncGenerator, List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, trim_messages
from langchain_core.messages.utils import count_tokens_approximately
from langchain_core.prompts.chat import ChatPromptTemplate, MessagesPlaceholder
from langgraph.prebuilt import create_react_agent

from .provider import get_llm_model
from .tools import get_tools


class TroveAgent:
    @classmethod
    async def generate_title(cls, message: str) -> str:
        fallback_title = message[:30] + ("..." if len(message) > 30 else "")
        try:
            llm = get_llm_model(temperature=0.0)
            res = await llm.ainvoke([
                ("system", "Generate a concise title (3-6 words) for a chat conversation based on the user message. Do not use quotes or punctuation."),
                ("user", message)
            ])
            if res and res.content:
                title = str(res.content).strip().strip('"\'')
                return title if title else fallback_title
        except Exception as err:
            print(f"[TroveAgent] Title generation failed: {err}")
        return fallback_title

    @classmethod
    async def stream_response(
        cls,
        message: str,
        history_messages: List[Dict[str, Any]],
        web_search: bool = False,
        context_text: str = "",
        upload_context: str = "",
        attachments_media: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[str, None]:
        llm = get_llm_model()
        tools = get_tools(web_search=web_search)
        agent = create_react_agent(llm, tools=tools)

        ROLE_MAP = {
            "user": HumanMessage,
            "assistant": AIMessage,
            "system": SystemMessage,
        }

        lc_messages = []
        for msg in history_messages:
            role = msg.get("role", "user").lower()
            content = msg.get("message") or msg.get("content") or ""
            msg_class = ROLE_MAP.get(role, HumanMessage)
            lc_messages.append(msg_class(content=content))

        # Build multimodal prompt if google_uri items exist
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

        trimmed_messages = trim_messages(
            lc_messages,
            max_tokens=10000,
            strategy="last",
            include_system=False,
            allow_partial=False,
            token_counter=count_tokens_approximately,
        )

        system_prompt = (
            "Your name is Trove. You are an intelligent, helpful AI assistant. "
            "Respond in clear, well-structured GitHub-flavored Markdown."
        )
        if web_search:
            system_prompt += " Use the web search tool whenever necessary to fetch up-to-date facts before answering."
        if context_text or upload_context:
            system_prompt += f"\n\nContext from relevant knowledge base and uploaded documents:\n{context_text}\n{upload_context}"

        prompt_template = ChatPromptTemplate([
            SystemMessage(content=system_prompt),
            MessagesPlaceholder("prev_history"),
        ])

        messages = prompt_template.invoke({
            "prev_history": trimmed_messages
        })

        async for step, info in agent.astream(messages, stream_mode="messages"):
            if info.get("langgraph_node") == "agent" and (chunk := step.text()):
                yield chunk
