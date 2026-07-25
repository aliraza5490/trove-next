from typing import TypedDict, Optional
from app.agent.core.state import TroveAgentState


class ScoutState(TroveAgentState, total=False):
    web_query: Optional[str]
