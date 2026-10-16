# Protocol 0x1162 - Quick Start Guide

Get up and running with Protocol 0x1162 in 5 minutes!

---

## 📦 Installation

### Option 1: Direct Usage (No Installation)

```bash
# Download the files
wget https://raw.githubusercontent.com/one2lv-com/protocol-0x1162/main/protocol_0x1162_runtime_v3.py

# Run example
python3 protocol_0x1162_runtime_v3.py
```

### Option 2: Package Installation

```bash
# Install from source
git clone https://github.com/one2lv-com/protocol-0x1162.git
cd protocol-0x1162
pip install -e .

# Or install from PyPI (when available)
pip install protocol-0x1162
```

---

## 🚀 Basic Usage (30 seconds)

```python
from protocol_0x1162_runtime_v3 import AgentKernel

# Create agent
agent = AgentKernel("MyAgent")

# Make decision
result = agent.make_decision("adjust temperature")

# Check result
if "error" not in result:
    print(f"Action: {result['action']}")
    print(f"Responsible: {result['responsibility_status']}")
```

---

## 💡 5-Minute Tutorial

### Step 1: Create an Agent (30 sec)

```python
from protocol_0x1162_runtime_v3 import AgentKernel

agent = AgentKernel("Tutorial_Agent")
```

### Step 2: Make a Decision (30 sec)

```python
result = agent.make_decision("what should I do?")

if "error" in result:
    print(f"❌ {result['error']}")
else:
    print(f"✅ {result['action']}")
```

### Step 3: Add Custom Constraint (1 min)

```python
from protocol_0x1162_runtime_v3 import Constraint, ConstraintType

# Add custom constraint
agent.constraint_engine.add_constraint(Constraint(
    id="my_constraint",
    description="My custom rule",
    type=ConstraintType.HARD,
    evaluator=lambda state: state.get("value", 0) > 10,
    violation_message="Value must be > 10"
))

# Now decisions will respect this constraint
result = agent.make_decision("test with constraint")
```

### Step 4: Use Custom Environment (2 min)

```python
from protocol_0x1162_runtime_v3 import EnvironmentInterface

class MyEnvironment(EnvironmentInterface):
    def __init__(self):
        self.state = {"status": "ok"}

    def observe(self):
        return self.state

    def act(self, action):
        # Your custom action logic here
        if "start" in action:
            self.state["status"] = "running"
        return self.state

    def validate(self, action):
        return "dangerous" not in action

# Use it
agent = AgentKernel("MyAgent", environment=MyEnvironment())
result = agent.make_decision("start process")
```

### Step 5: Track Causal Relationships (1 min)

```python
# Make multiple decisions
result1 = agent.make_decision("first action")
result2 = agent.make_decision("second action")

# Get causal context
if "decision_id" in result2:
    context = agent.get_causal_context(result2["decision_id"])
    chain = agent.get_causal_chain(result2["decision_id"])

    print(f"Context: {len(context)} related decisions")
    print(f"Chain: {len(chain)} decisions in sequence")
```

---

## 🎮 Interactive Mode

```bash
# Start interactive CLI
python3 protocol_0x1162_cli.py interactive

# Or with custom agent name
python3 protocol_0x1162_cli.py interactive --agent-name MyBot
```

**Interactive Commands:**
- `decide <question>` - Make a decision
- `status` - Show agent status
- `context <id>` - Show causal context
- `chain <id>` - Show causal chain
- `reset` - Reset agent
- `exit` - Exit

---

## 🧪 Run Tests

```bash
# Run all tests
python3 test_protocol_0x1162.py

# Or via CLI
python3 protocol_0x1162_cli.py test --verbose
```

---

## 📊 Common Patterns

### Pattern 1: Constraint-First Design

```python
agent = AgentKernel("SafeAgent")

# Add safety constraints BEFORE making decisions
agent.constraint_engine.add_constraint(Constraint(
    id="no_delete",
    type=ConstraintType.HARD,
    evaluator=lambda s: "delete" not in s.get("last_action", ""),
    violation_message="Delete operations not allowed"
))

# Now agent won't delete anything
result = agent.make_decision("clean up files")
```

### Pattern 2: Environment Simulation

```python
# Take snapshot before risky operation
snapshot = agent.environment.take_snapshot()

# Try operation
result = agent.make_decision("risky action")

# Rollback if failed
if "error" in result:
    agent.environment.rollback(snapshot.id)
    print("Rolled back to safe state")
```

### Pattern 3: Decision Replay

```python
# Make decision
result = agent.make_decision("test")

# Verify determinism
matches = agent.replay_decision(result['trace'])

if not matches:
    print("Warning: Non-deterministic behavior!")
```

---

## 🔌 Integration Examples

### With OpenAI

```python
from protocol_0x1162_integrations import LLMIntegratedAgent

agent = LLMIntegratedAgent(
    "GPT4_Agent",
    llm_provider="openai",
    api_key="your-api-key"
)

# Agent will use GPT-4 to generate candidate actions
result = agent.make_decision("write a poem")
```

### With File System

```python
from protocol_0x1162_integrations import FileSystemEnvironment

agent = AgentKernel(
    "FileAgent",
    environment=FileSystemEnvironment("/path/to/directory")
)

# Agent can now interact with files
result = agent.make_decision("list all files")
```

### With Control Plane Compilers

```python
from protocol_0x1162_integrations import ControlPlaneIntegratedAgent

agent = ControlPlaneIntegratedAgent("Agent1")

# Make distributed decision with other agents
result = agent.make_distributed_decision(
    "coordinate task",
    agents=["Agent2", "Agent3"]
)
```

---

## ⚡ Quick Tips

1. **Always add constraints before making decisions**
2. **Use `validate()` to check actions before executing**
3. **Take snapshots before risky operations**
4. **Check `responsibility_status` in results**
5. **Use causal chains to understand decision sequences**

---

## 🐛 Troubleshooting

### Decision always fails?
- Check if constraints are too strict
- Verify environment `validate()` returns True
- Look at `violations` in error result

### Can't import module?
- Make sure you're in the right directory
- Check Python version (requires 3.8+)
- Install with `pip install -e .`

### Environment not working?
- Implement all 3 methods: `observe()`, `act()`, `validate()`
- Return Dict from `observe()` and `act()`
- Return bool from `validate()`

---

## 📚 Next Steps

1. Read the full [README](PROTOCOL_0x1162_README.md)
2. Check out [integrations](protocol_0x1162_integrations.py)
3. Run the [test suite](test_protocol_0x1162.py)
4. Build your custom environment
5. Add domain-specific constraints

---

## 🆘 Get Help

- Issues: https://github.com/one2lv-com/protocol-0x1162/issues
- Docs: https://protocol0x1162.one2lv.com
- Email: dev@one2lv.io

---

**You're ready to build responsible AI agents!** 🚀
