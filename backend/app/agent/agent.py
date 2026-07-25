import json
from typing import AsyncGenerator, List, Dict, Any, Optional, Tuple

from app.agent.core.provider import get_llm_model
from app.agent.supervisor import resolve_active_agent, run_default_agent
from app.agent.agents import (
    run_scout_agent,
    run_draft_agent,
    run_brief_agent,
    run_plan_agent,
    run_recall_agent,
    run_read_agent,
)


from app.agent.core.utils import extract_text_content


class TroveAgent:
    @classmethod
    async def generate_title(cls, message: str) -> str:
        clean_message = message.strip()
        for tag in ["@scout", "@draft", "@brief", "@plan", "@recall", "@read", "@default", "@reset", "@auto"]:
            if clean_message.lower().startswith(tag):
                clean_message = clean_message[len(tag):].strip()
                break
        if not clean_message:
            clean_message = message

        fallback_title = clean_message[:30] + ("..." if len(clean_message) > 30 else "")
        try:
            llm = get_llm_model(temperature=0.0)
            res = await llm.ainvoke([
                ("system", "Generate a concise title (3-6 words) for a chat conversation based on the user message. Do not use quotes or punctuation."),
                ("user", clean_message)
            ])
            if res and res.content:
                text_content = extract_text_content(res.content)
                title = text_content.strip().strip('"\'')
                return title if title else fallback_title
        except Exception as err:
            print(f"[TroveAgent] Title generation failed: {err}")
        return fallback_title

    @classmethod
    async def stream_response(
        cls,
        message: str,
        history_messages: List[Dict[str, Any]],
        current_chat_agent: Optional[str] = None,
        web_search: bool = False,
        context_text: str = "",
        upload_context: str = "",
        attachments_media: Optional[List[Dict[str, Any]]] = None,
        chat_id: Optional[str] = None,
    ) -> AsyncGenerator[Tuple[str, Optional[str]], None]:
        """
        Yields (sse_chunk, resolved_db_agent) tuples.
        """
        selected_agent, new_db_agent, status_msg = resolve_active_agent(message, current_chat_agent)

        if status_msg:
            status_event = {
                "type": "status",
                "content": status_msg,
                "agent": selected_agent
            }
            yield (f"data: {json.dumps(status_event)}\n\n", new_db_agent)

        if selected_agent == "scout":
            agent_stream = run_scout_agent(
                message=message,
                history_messages=history_messages,
                web_search=web_search or True,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )
        elif selected_agent == "draft":
            agent_stream = run_draft_agent(
                message=message,
                history_messages=history_messages,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )
        elif selected_agent == "brief":
            agent_stream = run_brief_agent(
                message=message,
                history_messages=history_messages,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )
        elif selected_agent == "plan":
            agent_stream = run_plan_agent(
                message=message,
                history_messages=history_messages,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )
        elif selected_agent == "recall":
            agent_stream = run_recall_agent(
                message=message,
                history_messages=history_messages,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )
        elif selected_agent == "read":
            agent_stream = run_read_agent(
                message=message,
                history_messages=history_messages,
                chat_id=chat_id,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )
        else:
            agent_stream = run_default_agent(
                message=message,
                history_messages=history_messages,
                context_text=context_text,
                upload_context=upload_context,
                attachments_media=attachments_media,
            )

        async for chunk in agent_stream:
            yield (chunk, new_db_agent)
