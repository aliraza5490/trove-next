import ast
import json
from typing import Any


def extract_text_content(content: Any) -> str:
    """
    Safely extracts pure text string from raw LLM message content.
    Handles strings, dicts, lists, and stringified JSON/Python lists containing thinking/text blocks.
    """
    if not content:
        return ""

    if isinstance(content, str):
        str_val = content.strip()
        # If it looks like a stringified list of content dicts (e.g. "[{'type': 'thinking', ...}]")
        if str_val.startswith("[") and ("'type'" in str_val or '"type"' in str_val or "thinking" in str_val):
            try:
                try:
                    parsed = json.loads(str_val)
                except Exception:
                    parsed = ast.literal_eval(str_val)
                if isinstance(parsed, list):
                    return extract_text_content(parsed)
            except Exception:
                pass
        return str_val

    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, dict):
                item_type = item.get("type")
                if item_type == "thinking" or "thinking" in item:
                    continue
                if item_type == "text" and "text" in item:
                    text_parts.append(str(item["text"]))
                elif "text" in item:
                    text_parts.append(str(item["text"]))
                elif "content" in item:
                    text_parts.append(str(item["content"]))
        return "".join(text_parts).strip()

    if isinstance(content, dict):
        if content.get("type") == "thinking" or "thinking" in content:
            return ""
        if "text" in content:
            return str(content["text"]).strip()
        if "content" in content:
            return str(content["content"]).strip()

    return str(content).strip()
