# Protocol 0x1162 - Production Runtime v3

**Agentic Core v8.3** - Complete closed-loop agent system with enforceable constraints and environmental grounding

---

## 🎯 What This Is

A production-grade agent kernel that solves the **descriptive/normative separation problem** in AI agency:

- **Descriptive Agency**: What the system *does* (state machines, constraints, environment)
- **Normative Agency**: What the system *ought to do* (responsibility anchors, ethical evaluation)

This architecture provides:
1. **Enforceable Constraints** - Not just descriptions, but runtime-validated rules
2. **Execution Grounding** - Actions validated against external environment
3. **Causal Reasoning** - Explicit tracking of decision dependencies
4. **Responsibility Evaluation** - Separate normative checking from execution

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT KERNEL                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │  Constraint      │◄─────┤  Responsibility  │          │
│  │  Engine          │      │  Evaluator       │          │
│  └────────┬─────────┘      └─────────┬────────┘          │
│           │                          │                     │
│           │                          │                     │
│  ┌────────▼─────────┐      ┌────────▼────────┐          │
│  │  Decision        │◄─────┤  Causal         │          │
│  │  Trace           │      │  Engine         │          │
│  └────────┬─────────┘      └─────────────────┘          │
│           │                                                │
│           │                                                │
│  ┌────────▼─────────────────────────────────┐            │
│  │      Environment Interface               │            │
│  │  (observe / act / validate)              │            │
│  └──────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Core Components

### 1. Constraint Engine
**Enforceable constraints with runtime validation**

```python
from protocol_0x1162_runtime_v3 import Constraint, ConstraintType, ConstraintEngine

engine = ConstraintEngine()

# Define hard constraint
engine.add_constraint(Constraint(
    id="energy_positive",
    description="Energy must remain positive",
    type=ConstraintType.HARD,
    evaluator=lambda s: s.get("energy", 0) > 0,
    violation_message="Action would deplete energy"
))

# Evaluate against state
is_valid, result = engine.evaluate({"energy": 50})
print(f"Valid: {is_valid}, Confidence: {result['confidence']}")
```

**Features:**
- Hard/soft/risk constraint types
- Dependency tracking (DAG)
- Constraint composition (AND/OR)
- Violation reporting

### 2. Environment Interface
**External world grounding**

```python
from protocol_0x1162_runtime_v3 import MockEnvironment

env = MockEnvironment()

# Observe current state
state = env.observe()

# Validate action feasibility
if env.validate("increase temperature"):
    # Execute action
    new_state = env.act("increase temperature")

# Take state snapshot
snapshot = env.take_snapshot()

# Rollback if needed
env.rollback(snapshot.id)
```

**Features:**
- Abstract interface for any environment
- Action validation before execution
- State snapshots for rollback
- Observable state tracking

### 3. Causal Engine
**Explicit causal relationship tracking**

```python
from protocol_0x1162_runtime_v3 import CausalEngine, CausalLink

engine = CausalEngine()

# Add decision with causal links
trace.causal_links.append(CausalLink(
    source="decision_1",
    target="decision_2",
    relationship="causes",
    confidence=0.95
))

engine.add_decision(trace)

# Get causal context
context = engine.get_causal_context("decision_2")
chain = engine.get_causal_chain("decision_2")
```

**Features:**
- Explicit causal link representation
- Causal context retrieval
- Decision chain reconstruction
- Confidence tracking

### 4. Responsibility Evaluator
**Normative evaluation separate from execution**

```python
from protocol_0x1162_runtime_v3 import ResponsibilityEvaluator

# Generate evaluation anchors
anchors = ResponsibilityEvaluator.generate_anchors("delete file")
# Returns: ["Does this violate physical laws?", "Does this harm?", ...]

# Evaluate decision
is_responsible, reason = ResponsibilityEvaluator.evaluate_decision(trace)
```

**Features:**
- External evaluation criteria
- Constraint-based checking
- Violation detection
- Confidence scoring

### 5. Agent Kernel
**Complete closed-loop system**

```python
from protocol_0x1162_runtime_v3 import AgentKernel

agent = AgentKernel("MyAgent")

# Make decision with full pipeline
result = agent.make_decision("adjust temperature")

print(f"Action: {result['action']}")
print(f"Responsibility: {result['responsibility_status']}")
print(f"Environment: {result['environment_state']}")

# Get causal context
context = agent.get_causal_context(result['decision_id'])
chain = agent.get_causal_chain(result['decision_id'])

# Replay decision for verification
matches = agent.replay_decision(result['trace'])
```

**Features:**
- Complete decision pipeline
- Constraint enforcement
- Environment interaction
- Causal tracking
- Decision replay

---

## 🚀 Quick Start

### Installation

```bash
# Clone or download
git clone https://github.com/one2lv-com/protocol-0x1162.git
cd protocol-0x1162

# Install dependencies
pip install -r requirements.txt

# Run example
python3 protocol_0x1162_runtime_v3.py

# Run tests
python3 test_protocol_0x1162.py
```

### Basic Usage

```python
from protocol_0x1162_runtime_v3 import AgentKernel

# Create agent
agent = AgentKernel("MyAgent")

# Make decision
result = agent.make_decision("what should I do?")

if "error" in result:
    print(f"Decision blocked: {result['error']}")
    print(f"Violations: {result['violations']}")
else:
    print(f"Action: {result['action']}")
    print(f"Responsible: {result['responsibility_status']}")
    print(f"State: {result['environment_state']}")
```

### Custom Environment

```python
from protocol_0x1162_runtime_v3 import EnvironmentInterface, AgentKernel

class MyEnvironment(EnvironmentInterface):
    def observe(self) -> Dict:
        # Return current state
        return {"temperature": 20, "status": "ok"}

    def act(self, action: str) -> Dict:
        # Execute action, return new state
        return {"temperature": 25, "status": "ok"}

    def validate(self, action: str) -> bool:
        # Check if action is valid
        return "invalid" not in action

# Use custom environment
agent = AgentKernel("MyAgent", environment=MyEnvironment())
```

---

## 🧪 Testing

### Run All Tests

```bash
python3 test_protocol_0x1162.py
```

### Test Coverage

- ✅ Constraint Engine (4 tests)
- ✅ Causal Engine (2 tests)
- ✅ Mock Environment (4 tests)
- ✅ Responsibility Evaluator (2 tests)
- ✅ Agent Kernel (4 tests)

**Total: 16 tests, 100% pass rate**

### Test Individual Components

```python
import unittest
from test_protocol_0x1162 import TestConstraintEngine

# Run specific test suite
suite = unittest.TestLoader().loadTestsFromTestCase(TestConstraintEngine)
unittest.TextTestRunner(verbosity=2).run(suite)
```

---

## 📊 Decision Pipeline

```
Input Question
      ↓
┌─────────────────────────────┐
│ 1. Generate Responsibility  │
│    Anchors                  │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 2. Create Decision Trace    │
│    (with constraints)       │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 3. Evaluate Constraints     │
│    (prior state)            │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 4. Generate Candidate       │
│    Actions                  │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 5. Simulate Each Action     │
│    in Environment           │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 6. Evaluate Constraints     │
│    (posterior state)        │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 7. Score Actions            │
│    (goal alignment)         │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 8. Final Responsibility     │
│    Check                    │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 9. Update State & Record    │
│    Causal Links             │
└─────────────┬───────────────┘
              ↓
       Result
```

---

## 🎨 Advanced Features

### Constraint Composition

```python
c1 = Constraint(id="temp_low", evaluator=lambda s: s["temp"] < 30)
c2 = Constraint(id="energy_high", evaluator=lambda s: s["energy"] > 50)

# Compose constraints
and_c = engine.and_constraint(c1, c2)
or_c = engine.or_constraint(c1, c2)
```

### State Snapshots

```python
# Take snapshot before risky operation
snapshot = agent.environment.take_snapshot()

# Try operation
result = agent.make_decision("risky action")

# Rollback if failed
if "error" in result:
    agent.environment.rollback(snapshot.id)
```

### Decision Replay

```python
# Verify determinism
result = agent.make_decision("test")
matches = agent.replay_decision(result['trace'])

if not matches:
    print("Warning: Non-deterministic behavior detected!")
```

### Causal Chain Analysis

```python
# Get full causal chain
chain = agent.get_causal_chain(decision_id)

print("Decision chain:")
for i, trace in enumerate(chain):
    print(f"{i+1}. {trace.decision_id}: {trace.surface}")
```

---

## 🔌 Integration Examples

### With LLM

```python
import openai

class LLMAgentKernel(AgentKernel):
    def _generate_candidate_actions(self, question: str) -> List[str]:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{
                "role": "user",
                "content": f"Generate 5 possible actions for: {question}"
            }]
        )
        return response.choices[0].message.content.split("\n")
```

### With File System

```python
import os
from pathlib import Path

class FileSystemEnvironment(EnvironmentInterface):
    def observe(self) -> Dict:
        return {
            "files": list(Path(".").glob("*")),
            "cwd": os.getcwd()
        }

    def act(self, action: str) -> Dict:
        if "create" in action:
            filename = action.split()[-1]
            Path(filename).touch()
        return self.observe()

    def validate(self, action: str) -> bool:
        return any(cmd in action for cmd in ["create", "read", "list"])
```

### With Control Plane Compilers

```python
from control_plane_compilers import DistributedControlPlaneCompiler

class CompilerIntegratedAgent(AgentKernel):
    def __init__(self, name: str):
        super().__init__(name)
        self.compiler = DistributedControlPlaneCompiler()

    def make_decision(self, question: str) -> Dict:
        # Use compiler for distributed consensus
        fragment = self.compiler.compile_agent_fragment({
            "nodes": self._generate_decision_nodes(question),
            "edges": self._generate_decision_edges(question)
        })

        # Then execute through agent kernel
        return super().make_decision(question)
```

---

## 📚 API Reference

### Constraint

```python
@dataclass
class Constraint:
    id: str
    description: str
    type: ConstraintType  # HARD, SOFT, RISK
    evaluator: Callable[[Dict], bool]
    violation_message: str = "Constraint violated"
    weight: float = 1.0
```

### DecisionTrace

```python
@dataclass
class DecisionTrace:
    decision_id: str
    surface: str
    constraints: List[Constraint]
    system_risks: List[str]
    behavioral_impacts: List[str]
    meta_implications: List[str]
    responsibility_anchors: List[str]
    causal_links: List[CausalLink]
    prior_state: Dict
    posterior_state: Dict
    timestamp: str
    confidence: float
```

### EnvironmentInterface

```python
class EnvironmentInterface(ABC):
    @abstractmethod
    def observe(self) -> Dict:
        """Get current environment state"""

    @abstractmethod
    def act(self, action: str) -> Dict:
        """Execute action in environment"""

    @abstractmethod
    def validate(self, action: str) -> bool:
        """Check if action is physically possible"""
```

---

## 🎯 Key Design Principles

### 1. Separation of Concerns
- **Descriptive**: State machines, constraints, environment
- **Normative**: Responsibility anchors, ethical evaluation

### 2. Enforceable Constraints
- Runtime validation, not just documentation
- Hard/soft/risk levels
- Composition support

### 3. Environmental Grounding
- Abstract environment interface
- Action validation before execution
- Observable state tracking

### 4. Explicit Causality
- Causal links between decisions
- Chain reconstruction
- Context retrieval

### 5. Testability
- All components unit tested
- Deterministic replay
- Snapshot/rollback support

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Multi-agent coordination
- [ ] Distributed constraint solving
- [ ] LLM integration templates
- [ ] Real-world environment adapters
- [ ] Visualization tools
- [ ] Performance monitoring
- [ ] Constraint learning

### Extension Points
- Custom environment implementations
- Domain-specific constraints
- Alternative causal reasoning
- Different scoring functions

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Environment adapters (APIs, file systems, databases)
- LLM integration patterns
- Constraint templates for common domains
- Visualization tools
- Performance optimizations

---

## 📞 Support

- GitHub Issues: https://github.com/one2lv-com/protocol-0x1162/issues
- Documentation: https://protocol0x1162.one2lv.com
- Email: dev@one2lv.io

---

## 🌟 Examples

See `examples/` directory for:
- Basic agent usage
- Custom environment creation
- Constraint composition
- LLM integration
- Multi-agent coordination
- Control plane integration

---

## 📊 Performance

**Benchmark Results** (MacBook Pro M1):
- Constraint evaluation: ~0.001ms
- Decision generation: ~10ms
- Environment interaction: ~1ms
- Causal context retrieval: ~0.1ms

---

## 🎓 Research

This architecture implements concepts from:
- Protocol 0x1162 (Original specification)
- Causal Agency Theory
- Constraint-Based AI
- Responsibility in Autonomous Systems

**Citations:**
```bibtex
@software{protocol0x1162,
  title={Protocol 0x1162: Production Runtime v3},
  author={One2lv Systems},
  year={2024},
  url={https://github.com/one2lv-com/protocol-0x1162}
}
```

---

**Protocol 0x1162 - Where Agency Meets Responsibility** 🚀
