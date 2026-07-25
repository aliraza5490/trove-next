from langgraph.graph import StateGraph, END
from app.agent.agents.recall.state import RecallState


def build_recall_graph():
    builder = StateGraph(RecallState)
    builder.add_node("recall", lambda state: state)
    builder.set_entry_point("recall")
    builder.add_edge("recall", END)
    return builder.compile()


recall_graph = build_recall_graph()
