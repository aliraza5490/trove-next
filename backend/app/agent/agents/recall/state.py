from typing import TypedDict, Optional
from app.agent.core.state import TroveAgentState


class RecallState(TroveAgentState, total=False):
    memory_query: Optional[str]
