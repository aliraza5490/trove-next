import os
from typing import List
from langchain_core.tools import BaseTool
from langchain_tavily import TavilySearch
from app.settings import settings


def get_tools(web_search: bool = False) -> List[BaseTool]:
    tools: List[BaseTool] = []
    if web_search:
        tavily_key = getattr(settings, "TAVILY_API_KEY", None) or os.getenv("TAVILY_API_KEY")
        if tavily_key:
            search_tool = TavilySearch(
                max_results=5,
                topic="general",
                tavily_api_key=tavily_key,
            )
            tools.append(search_tool)
    return tools
