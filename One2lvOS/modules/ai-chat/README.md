# 🤖 AI Chat Module - NVIDIA Nemotron Integration

## Overview

The AI Chat module integrates **NVIDIA Nemotron-3-Ultra-550B-A55B** directly into One2lvOS. This provides access to one of the most advanced AI reasoning models with 550 billion parameters.

## Features

### 🧠 Advanced Reasoning
- **Model:** NVIDIA Nemotron-3-Ultra-550B-A55B
- **Parameters:** 550 billion
- **Reasoning Budget:** 16,384 tokens
- **Max Output:** 16,384 tokens
- **Thinking Process:** Visible reasoning chains

### 💬 Chat Interface
- Beautiful glass morphism UI
- Real-time conversation
- Message history
- Thinking process viewer (collapsible)
- Token usage tracking
- Conversation export/import

### ⚙️ Configuration
- Toggle thinking display
- Temperature control (default: 1.0)
- Top-p sampling (default: 0.95)
- Adjustable token limits
- System prompt customization

## Usage

### Launch from Dock
Click the **🤖 AI Chat** icon in the dock to open the chat window.

### Programmatic Access

```javascript
// Send a message
const response = await AIChat.sendMessage('Explain quantum computing');

console.log(response.content);    // AI response
console.log(response.thinking);   // Reasoning process
console.log(response.usage);      // Token usage

// With custom configuration
const response = await AIChat.sendMessage('Hello!', {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 8192,
    enable_thinking: true
});
```

### Managing History

```javascript
// Get conversation history
const history = AIChat.getHistory();

// Clear history
AIChat.clearHistory();

// Set system prompt
AIChat.setSystemPrompt('You are a helpful AI assistant specialized in systems programming.');
```

### Export/Import

```javascript
// Export conversation
const filename = await AIChat.exportConversation();
// Saves to /exports/nemotron-chat-{timestamp}.json

// Import conversation
await AIChat.importConversation('nemotron-chat-1722513600000.json');
```

## API Configuration

### Default Settings

```javascript
{
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    reasoning_budget: 16384,
    enable_thinking: true,
    stream: false
}
```

### API Endpoint
```
POST https://integrate.api.nvidia.com/v1/chat/completions
```

### Authentication
The API key is pre-configured in the module. For production use, consider:
1. Moving the key to environment variables
2. Using a backend proxy
3. Implementing key rotation
4. Adding rate limiting

## UI Features

### Chat Window
- **Header:** Model info and controls
- **Messages:** User/AI conversation display
- **Input:** Multi-line text input with auto-resize
- **Status:** Real-time connection status

### Controls
- **Clear History** - Resets conversation
- **Export** - Save conversation to filesystem
- **Thinking Toggle** - Show/hide reasoning process
- **Send** - Submit message (or Enter key)

### Message Types
- **User** - Blue background, right-aligned
- **Assistant** - Cyan background, left-aligned
- **Thinking** - Purple background, collapsible details
- **System** - Gray background, centered
- **Error** - Red background

## Integration with One2lvOS

### Memory Integration
All conversations are automatically stored in ReactorMemory:

```javascript
// Last interaction stored in short-term memory
const last = await ReactorMemory.retrieve('ai_chat_last', 'short');

console.log(last.userMessage);
console.log(last.response);
console.log(last.thinking);
```

### FileSystem Integration
Conversations are exported to the virtual filesystem:

```javascript
// List exported conversations
const exports = await FileSystem.list('/exports');

// Read a conversation
const data = await FileSystem.read('/exports/nemotron-chat-123456.json');
const conversation = JSON.parse(data);
```

### Event System
The module emits events via EventBus:

```javascript
EventBus.on('aichat:message-sent', (data) => {
    console.log('User sent:', data.message);
});

EventBus.on('aichat:response-received', (data) => {
    console.log('AI responded:', data.content);
});
```

## Examples

### Example 1: Simple Question
```javascript
const response = await AIChat.sendMessage('What is One2lvOS?');
console.log(response.content);
```

### Example 2: With System Prompt
```javascript
AIChat.setSystemPrompt('You are an expert in steganography and PNG encoding.');
const response = await AIChat.sendMessage('Explain LSB embedding');
```

### Example 3: Council Integration
```javascript
// Ask AI to analyze a decision
const topic = 'Should we implement feature X?';
const decision = await Council.deliberate(topic, { risk: 'medium' });

// Get AI opinion
const response = await AIChat.sendMessage(
    `The council decided: ${decision.outcome}. What are your thoughts?`
);

console.log(response.content);
```

### Example 4: Code Review
```javascript
const code = `
function encode(data) {
    return Buffer.from(data).toString('base64');
}
`;

const response = await AIChat.sendMessage(
    `Review this code for security issues:\n\n${code}`
);

console.log(response.content);
```

## Token Usage

The model has generous limits:
- **Max Tokens:** 16,384
- **Reasoning Budget:** 16,384
- **Context Window:** Large enough for extended conversations

Token usage is displayed after each response:
```
Tokens: 256 • Completion: 128
```

## Thinking Process

When enabled, the model shows its reasoning:

```
💭 Thinking Process
Click to view reasoning (1234 characters)
  [Collapsible details with full reasoning chain]
```

This is valuable for:
- Understanding the model's logic
- Debugging unexpected responses
- Learning problem-solving approaches
- Transparency in AI decision-making

## Security Considerations

### API Key
- Currently hardcoded in module
- **Recommendation:** Move to secure backend
- Consider: Environment variables, secrets manager

### Content Filtering
- No built-in content filtering
- **Recommendation:** Add input validation
- Consider: Prompt injection detection

### Rate Limiting
- No rate limiting implemented
- **Recommendation:** Add request throttling
- Consider: User quotas, cooldown periods

### Privacy
- All conversations stored locally
- **Recommendation:** Add encryption option
- Consider: User consent, data retention policies

## Performance

### Average Response Time
- Simple queries: 2-5 seconds
- Complex reasoning: 5-15 seconds
- Long responses: 10-30 seconds

### Network Requirements
- Requires internet connection
- HTTPS only
- CORS-enabled API

## Troubleshooting

### "API Error: 401"
- Check API key is valid
- Verify key hasn't expired

### "API Error: 429"
- Rate limit exceeded
- Wait and retry
- Consider implementing backoff

### "No response from API"
- Check network connection
- Verify API endpoint is accessible
- Check browser console for errors

### Thinking Not Showing
- Verify thinking toggle is ON
- Check if model returned thinking data
- Some responses may not include thinking

## Future Enhancements

- [ ] Streaming responses (real-time output)
- [ ] Multiple conversation threads
- [ ] Conversation search
- [ ] Voice input/output
- [ ] Model switching (other NVIDIA models)
- [ ] Fine-tuning integration
- [ ] Multi-modal support (images)
- [ ] Collaborative chat (multiple users)
- [ ] Plugin system for extensions
- [ ] Automated summarization

## API Reference

### AIChat.sendMessage(message, config)
Sends a message to Nemotron.

**Parameters:**
- `message` (string): User message
- `config` (object): Optional configuration

**Returns:** Promise<Object>
```javascript
{
    content: string,      // AI response
    thinking: string,     // Reasoning process (if enabled)
    usage: {              // Token usage
        total_tokens: number,
        completion_tokens: number
    },
    model: string         // Model used
}
```

### AIChat.clearHistory()
Clears the conversation history.

### AIChat.getHistory()
Returns the conversation history array.

### AIChat.setSystemPrompt(prompt)
Sets or updates the system prompt.

### AIChat.exportConversation()
Exports conversation to filesystem.

**Returns:** Promise<string> - Filename

### AIChat.importConversation(filename)
Imports conversation from filesystem.

**Returns:** Promise<boolean> - Success status

### ChatWindow.create()
Opens the chat window UI.

---

**NVIDIA Nemotron Integration** - Advanced AI reasoning for One2lvOS 🚀
