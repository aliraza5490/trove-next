from typing import TypedDict, Optional
from app.agent.core.state import TroveAgentState


class BriefState(TroveAgentState, total=False):
    transcript_text: Optional[str]
