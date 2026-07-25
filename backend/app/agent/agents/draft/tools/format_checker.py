def validate_markdown_format(content: str) -> str:
    if not content:
        return content
    return content.strip()
