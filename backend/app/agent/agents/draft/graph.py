from langgraph.graph import StateGraph, END
from app.agent.agents.draft.state import DraftState


def build_draft_graph():
    builder = StateGraph(DraftState)
    builder.add_node("draft", lambda state: state)
    builder.set_entry_point("draft")
    builder.add_edge("draft", END)
    return builder.compile()


draft_graph = build_draft_graph()
