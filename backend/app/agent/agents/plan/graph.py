from langgraph.graph import StateGraph, END
from app.agent.agents.plan.state import PlanState


def build_plan_graph():
    builder = StateGraph(PlanState)
    builder.add_node("plan", lambda state: state)
    builder.set_entry_point("plan")
    builder.add_edge("plan", END)
    return builder.compile()


plan_graph = build_plan_graph()
