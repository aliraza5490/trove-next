from langgraph.graph import StateGraph, END
from app.agent.agents.scout.state import ScoutState


def build_scout_graph():
    builder = StateGraph(ScoutState)
    builder.add_node("scout", lambda state: state)
    builder.set_entry_point("scout")
    builder.add_edge("scout", END)
    return builder.compile()


scout_graph = build_scout_graph()
