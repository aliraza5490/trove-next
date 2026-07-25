from langgraph.graph import StateGraph, END
from app.agent.agents.brief.state import BriefState


def build_brief_graph():
    builder = StateGraph(BriefState)
    builder.add_node("brief", lambda state: state)
    builder.set_entry_point("brief")
    builder.add_edge("brief", END)
    return builder.compile()


brief_graph = build_brief_graph()
