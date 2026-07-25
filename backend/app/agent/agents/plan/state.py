from typing import TypedDict, Optional
from app.agent.core.state import TroveAgentState


class PlanState(TroveAgentState, total=False):
    goal_description: Optional[str]
