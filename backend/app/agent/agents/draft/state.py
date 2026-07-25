from typing import TypedDict, Optional
from app.agent.core.state import TroveAgentState


class DraftState(TroveAgentState, total=False):
    draft_tone: Optional[str]
