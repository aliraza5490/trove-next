from typing import Optional, Tuple

AGENT_MENTIONS = {
    "@scout": "scout",
    "@draft": "draft",
    "@brief": "brief",
    "@plan": "plan",
    "@recall": "recall",
    "@read": "read",
    "@default": "default",
    "@reset": "default",
    "@auto": "default",
}

AGENT_DISPLAY_NAMES = {
    "scout": "Scout (Research Agent)",
    "draft": "Draft (Writing Agent)",
    "brief": "Brief (Meeting Agent)",
    "plan": "Plan (Planning Agent)",
    "recall": "Recall (Knowledge Agent)",
    "read": "Read (Document Agent)",
    "default": "Default Assistant",
}


def resolve_active_agent(message: str, current_chat_agent: Optional[str] = None) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Resolves the active agent for the turn.
    Returns: (selected_agent, new_db_agent, status_message)
    """
    message_lower = message.lower()
    found_mention: Optional[str] = None
    
    for tag, agent_key in AGENT_MENTIONS.items():
        if tag in message_lower:
            found_mention = agent_key
            break

    if found_mention:
        if found_mention == "default":
            return "default", None, "Resetting agent selection to Default Assistant."
        else:
            agent_name = AGENT_DISPLAY_NAMES.get(found_mention, found_mention.capitalize())
            return found_mention, found_mention, f"Selected {agent_name} for this conversation."
    
    if current_chat_agent and current_chat_agent in AGENT_DISPLAY_NAMES and current_chat_agent != "default":
        agent_name = AGENT_DISPLAY_NAMES[current_chat_agent]
        return current_chat_agent, current_chat_agent, f"Using active agent: {agent_name}."
    
    return "default", None, "Using Default Assistant."
