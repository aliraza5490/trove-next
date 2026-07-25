from langgraph.graph import StateGraph, END
from app.agent.agents.read.state import ReadState


def build_read_graph():
    builder = StateGraph(ReadState)
    builder.add_node("read", lambda state: state)
    builder.set_entry_point("read")
    builder.add_edge("read", END)
    return builder.compile()


read_graph = build_read_graph()
