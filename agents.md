# Trove Agents

Trove is a personal AI workspace built around specialized agents that help users research, write, plan, understand meetings, retrieve past knowledge, and work with documents.

## 1. Scout

**Category:** Online Research Agent

**Purpose:** Research information across the web and provide useful, well-structured answers with relevant sources.

### Capabilities

- Search the web for current information
- Research unfamiliar topics
- Compare products, technologies, companies, or ideas
- Gather information from multiple sources
- Summarize research findings
- Provide source citations
- Identify important trends and insights

### Example Queries

- "Research the latest trends in AI agents."
- "Compare PostgreSQL and MongoDB for this project."
- "Find the best open-source RAG frameworks."
- "Research my competitors and summarize their key features."

---

## 2. Draft

**Category:** Writing Agent

**Purpose:** Help users create, rewrite, edit, and improve written content.

### Capabilities

- Write emails and messages
- Draft articles and blog posts
- Create LinkedIn posts
- Rewrite existing content
- Improve grammar and clarity
- Change tone and style
- Summarize long-form content
- Turn notes into polished documents

### Example Queries

- "Write a professional email to my client."
- "Turn these notes into a LinkedIn post."
- "Rewrite this paragraph to sound more professional."
- "Proofread this document."
- "Make this message shorter and clearer."

---

## 3. Brief

**Category:** Meeting Agent

**Purpose:** Turn meetings, transcripts, and notes into concise summaries and actionable outcomes.

### Capabilities

- Summarize meetings
- Extract key decisions
- Identify action items
- Identify participants and responsibilities
- Generate follow-up messages
- Extract important discussion points
- Create structured meeting notes

### Example Queries

- "Summarize this meeting transcript."
- "Extract all action items and their owners."
- "What decisions were made during this meeting?"
- "Create a follow-up email based on this meeting."
- "Give me the key takeaways from this discussion."

---

## 4. Plan

**Category:** Ask & Planning Agent

**Purpose:** Help users think through problems, organize ideas, prioritize tasks, and create actionable plans.

### Capabilities

- Break large goals into smaller tasks
- Create project plans
- Prioritize tasks
- Create daily and weekly plans
- Brainstorm solutions
- Organize ideas
- Identify dependencies and risks
- Help users make decisions

### Example Queries

- "Plan my workday around these five tasks."
- "Break this project into actionable tasks."
- "Create a roadmap for launching my SaaS."
- "What should I prioritize today?"
- "Help me figure out how to approach this problem."

---

## 5. Recall

**Category:** Knowledge Agent

**Purpose:** Search and reason over the user's previous conversations to retrieve useful context, decisions, ideas, and information.

### Capabilities

- Search past conversations
- Retrieve previous decisions
- Find previously discussed ideas
- Connect information across conversations
- Summarize historical discussions
- Identify recurring topics
- Recover forgotten context

### Example Queries

- "What did we decide about the database architecture?"
- "Find our previous discussion about RAG."
- "What projects did I discuss last month?"
- "What technologies did I consider for my thesis?"
- "Remind me what we discussed about this project."

---

## 6. Read

**Category:** Document Agent

**Purpose:** Understand, analyze, and extract information from uploaded documents.

### Capabilities

- Read and summarize documents
- Answer questions about documents
- Search document contents
- Extract structured information
- Compare multiple documents
- Find relevant passages
- Explain complex sections
- Perform document-based RAG

### Example Queries

- "Summarize this PDF."
- "What are the key requirements in this document?"
- "Find every mention of authentication."
- "Compare these two documents."
- "Explain this section in simple terms."
- "What does this contract say about termination?"

---

# Agent Overview

| Agent | Name | Primary Function |
|---|---|---|
| Online Research Agent | **Scout** | Research the web |
| Writing Agent | **Draft** | Write and improve content |
| Meeting Agent | **Brief** | Summarize meetings and extract actions |
| Ask & Planning Agent | **Plan** | Organize, reason, and plan |
| Knowledge Agent | **Recall** | Search past conversations |
| Document Agent | **Read** | Understand uploaded documents |

## Product Philosophy

Trove should allow users to interact naturally rather than requiring them to manually choose an agent for every task.

The **Personal Assistant / Orchestrator** can determine which agent or combination of agents is required.

For example:

> "Research the latest RAG techniques, compare them with what we discussed last month, and create a technical summary."

Trove can orchestrate:

```text
User
  |
  v
Trove Orchestrator
  |
  +--> Scout
  |      Web research
  |
  +--> Recall
  |      Past conversation retrieval
  |
  +--> Draft
         Technical summary
```

This makes Trove a unified AI workspace rather than a collection of disconnected chatbots.