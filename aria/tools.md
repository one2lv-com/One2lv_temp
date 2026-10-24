# Tools Catalog

## Core Tools

### ShellTool
- **Module**: tools/shell_tool.py
- **Description**: Execute shell commands safely
- **Input**: `{"command": "string"}`
- **Output**: stdout, stderr, return code

### FileTool
- **Module**: tools/file_tool.py
- **Description**: Read, write, append, list, search files
- **Operations**: read, write, append, list, search, delete

### LLMTool
- **Module**: tools/llm_tool.py
- **Description**: Call NVIDIA LLM API with any prompt
- **Models**: step-3.5-flash, kimi-k2-instruct-0905

### MemoryTool
- **Module**: tools/memory_tool.py
- **Description**: Read/write/search agent memory
- **Operations**: read, write, search, clear_section

### SwarmTool
- **Module**: tools/swarm_tool.py
- **Description**: Spawn parallel sub-agents for distributed tasks
- **Operations**: spawn, broadcast, gather, terminate

### LearnTool
- **Module**: tools/learn_tool.py
- **Description**: Dynamically add new skills and tools
- **Operations**: add_skill, add_tool, list_skills, list_tools

### VoiceTool
- **Module**: tools/voice_tool.py
- **Description**: Text-to-speech and speech-to-text
- **Operations**: speak, listen, set_voice, set_rate

## Dynamic Tools
<!-- Auto-registered when agent learns new tools -->

### VisionTool
- **Module**: tools/vision_tool.py
- **Description**: Image analysis using NVIDIA NIM vision models
- **Operations**: analyze(image_url, query), analyze_local, list_models
- **Models**: phi-3-vision, phi-3.5-vision, nemotron-3b-vision, llama-3.2-90b-vision, cosmos-1.0-vision

### MatonTool
- **Module**: tools/maton_tool.py
- **Description**: Universal gateway to 12+ apps via Maton API (single key)
- **Apps**: Slack, GitHub, Gmail, Notion, Salesforce, Jira, Linear, Supabase, Stripe, X/Twitter, LinkedIn, Discord
- **Operations**: list_connections, create_connection, call_app_api, slack_post_message, github_create_issue, gmail_send_message, notion_create_page, linear_create_issue, stripe_list_customers, x_post_tweet, discord_send_message
- **Dispatch**: maton_tool_dispatch(action, args)

### LobbyTool (BuildLobby)
- **Module**: tools/build_lobby.py
- **Description**: File-backed multi-agent build lobby with cross-process locking
- **Operations**: register_agent, send_message, broadcast, direct_message, update_build_state, add_blocker, remove_blocker, add_patch, add_artifact, heartbeat, get_messages, get_state
- **Roles**: orchestrator, builder, watcher, reviewer, tester
- **Message types**: handoff, status, error, warning, chat, command, artifact, heartbeat, phase_change
