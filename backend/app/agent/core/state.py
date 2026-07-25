from typing import TypedDict, List, Dict, Any, Optional
from langchain_core.messages import BaseMessage


class TroveAgentState(TypedDict, total=False):
    messages: List[BaseMessage]
    user_id: str
    chat_id: Optional[str]
    selected_agent: str
    web_search: bool
    context_text: str
    upload_context: str
    attachments_media: Optional[List[Dict[str, Any]]]
