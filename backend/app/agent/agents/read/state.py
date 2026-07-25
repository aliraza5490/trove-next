from typing import TypedDict, Optional
from app.agent.core.state import TroveAgentState


class ReadState(TroveAgentState, total=False):
    doc_query: Optional[str]
