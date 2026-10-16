#!/usr/bin/env python3
"""
Protocol 0x1162 Integrations
Integration modules for external systems and control plane compilers
"""

from protocol_0x1162_runtime_v3 import (
    AgentKernel, EnvironmentInterface, Constraint, ConstraintType
)
from typing import Dict, List, Optional
import json

# ========== CONTROL PLANE COMPILER INTEGRATION ==========

class ControlPlaneIntegratedAgent(AgentKernel):
    """
    Agent kernel integrated with Control Plane Compilers
    Enables distributed multi-agent decision making
    """

    def __init__(self, name: str, compiler_integration: bool = True):
        super().__init__(name)
        self.compiler_integration = compiler_integration
        self.compiler = None

        if compiler_integration:
            try:
                # Try to import control plane compilers
                from control_plane_compilers import DistributedControlPlaneCompiler
                self.compiler = DistributedControlPlaneCompiler()
            except ImportError:
                print("Warning: Control Plane Compilers not available")
                self.compiler_integration = False

    def make_distributed_decision(self, question: str, agents: List[str]) -> Dict:
        """
        Make decision using distributed compiler consensus
        """
        if not self.compiler_integration or not self.compiler:
            # Fallback to standard decision
            return self.make_decision(question)

        # Create graph fragment for this agent
        fragment = {
            "agent_id": self.name,
            "nodes": self._decision_to_nodes(question),
            "edges": self._decision_to_edges(question),
            "timestamp": None  # Will be set by compiler
        }

        # Register fragment with compiler
        self.compiler.register_agent_fragment(fragment)

        # Compute consensus (would involve other agents in real system)
        consensus_graph = self.compiler.compute_consensus_graph()

        # Execute through standard pipeline with consensus context
        result = self.make_decision(question)
        result["consensus_score"] = consensus_graph.get("consensus_score", 0.0)

        return result

    def _decision_to_nodes(self, question: str) -> List[Dict]:
        """Convert decision question to graph nodes"""
        return [
            {"id": f"node_{self.name}_input", "type": "input", "data": question},
            {"id": f"node_{self.name}_process", "type": "process", "data": "evaluate"},
            {"id": f"node_{self.name}_output", "type": "output", "data": "action"}
        ]

    def _decision_to_edges(self, question: str) -> List[Dict]:
        """Convert decision flow to graph edges"""
        return [
            {"from": f"node_{self.name}_input", "to": f"node_{self.name}_process", "weight": 1.0},
            {"from": f"node_{self.name}_process", "to": f"node_{self.name}_output", "weight": 1.0}
        ]

# ========== FILE SYSTEM INTEGRATION ==========

class FileSystemEnvironment(EnvironmentInterface):
    """
    File system environment adapter
    Allows agent to interact with local file system
    """

    def __init__(self, base_path: str = "."):
        import os
        from pathlib import Path
        self.base_path = Path(base_path)
        self.current_path = self.base_path
        self.file_log = []

    def observe(self) -> Dict:
        """Observe current file system state"""
        import os
        from pathlib import Path

        files = list(self.current_path.glob("*"))
        return {
            "current_directory": str(self.current_path),
            "files": [f.name for f in files if f.is_file()],
            "directories": [f.name for f in files if f.is_dir()],
            "total_files": len([f for f in files if f.is_file()]),
            "permissions": "read_write"
        }

    def act(self, action: str) -> Dict:
        """Execute file system action"""
        from pathlib import Path

        self.file_log.append(action)

        if "list" in action.lower():
            # Already captured in observe
            pass

        elif "create" in action.lower():
            # Create file
            filename = action.split()[-1] if len(action.split()) > 1 else "newfile.txt"
            filepath = self.current_path / filename
            filepath.touch()

        elif "read" in action.lower():
            # Read file (simulated)
            filename = action.split()[-1] if len(action.split()) > 1 else None
            if filename:
                filepath = self.current_path / filename
                if filepath.exists():
                    # In real implementation, would read file
                    pass

        elif "delete" in action.lower():
            # Delete file (simulated - be careful!)
            filename = action.split()[-1] if len(action.split()) > 1 else None
            if filename:
                filepath = self.current_path / filename
                if filepath.exists() and filepath.is_file():
                    # In real implementation with safety checks
                    pass

        return self.observe()

    def validate(self, action: str) -> bool:
        """Validate file system action"""
        # Check for dangerous operations
        dangerous_keywords = ["format", "rm -rf", "delete *", "rmdir"]
        if any(keyword in action.lower() for keyword in dangerous_keywords):
            return False

        # Check for valid commands
        valid_commands = ["list", "create", "read", "delete", "cd", "pwd"]
        return any(cmd in action.lower() for cmd in valid_commands)

# ========== API INTEGRATION ==========

class APIEnvironment(EnvironmentInterface):
    """
    API environment adapter
    Allows agent to interact with external APIs
    """

    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.request_log = []

    def observe(self) -> Dict:
        """Observe API status"""
        return {
            "base_url": self.base_url,
            "authenticated": self.api_key is not None,
            "requests_made": len(self.request_log),
            "available": True
        }

    def act(self, action: str) -> Dict:
        """Execute API request"""
        import urllib.request
        import json

        self.request_log.append(action)

        try:
            # Parse action into HTTP method and endpoint
            parts = action.split()
            if len(parts) < 2:
                return self.observe()

            method = parts[0].upper()
            endpoint = parts[1]

            # Construct URL
            url = f"{self.base_url}/{endpoint.lstrip('/')}"

            # Make request (simplified)
            req = urllib.request.Request(url, method=method)
            if self.api_key:
                req.add_header('Authorization', f'Bearer {self.api_key}')

            # In real implementation, would execute request
            # response = urllib.request.urlopen(req)

            return {
                **self.observe(),
                "last_request": action,
                "status": "simulated"
            }

        except Exception as e:
            return {
                **self.observe(),
                "error": str(e)
            }

    def validate(self, action: str) -> bool:
        """Validate API action"""
        # Check for valid HTTP methods
        valid_methods = ["GET", "POST", "PUT", "DELETE", "PATCH"]
        parts = action.split()
        if not parts:
            return False

        return parts[0].upper() in valid_methods

# ========== LLM INTEGRATION ==========

class LLMIntegratedAgent(AgentKernel):
    """
    Agent with LLM integration for action generation
    """

    def __init__(self, name: str, llm_provider: str = "openai", api_key: Optional[str] = None):
        super().__init__(name)
        self.llm_provider = llm_provider
        self.api_key = api_key

    def _generate_candidate_actions(self, question: str) -> List[str]:
        """Generate actions using LLM"""

        if self.llm_provider == "openai" and self.api_key:
            try:
                import openai
                openai.api_key = self.api_key

                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an action generator. Generate 5 possible actions for the given question. Each action should be a single line."},
                        {"role": "user", "content": question}
                    ],
                    max_tokens=200
                )

                actions = response.choices[0].message.content.strip().split("\n")
                return [a.strip() for a in actions if a.strip()]

            except Exception as e:
                print(f"LLM generation failed: {e}, falling back to rule-based")

        # Fallback to parent implementation
        return super()._generate_candidate_actions(question)

# ========== DATABASE INTEGRATION ==========

class DatabaseEnvironment(EnvironmentInterface):
    """
    Database environment adapter
    Allows agent to interact with databases
    """

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.query_log = []
        self.connection = None

    def observe(self) -> Dict:
        """Observe database state"""
        return {
            "connected": self.connection is not None,
            "queries_executed": len(self.query_log),
            "connection_string": self.connection_string.split("@")[-1] if "@" in self.connection_string else "local"
        }

    def act(self, action: str) -> Dict:
        """Execute database query"""
        self.query_log.append(action)

        # In real implementation, would execute SQL query
        # For safety, this is just a simulation

        if "SELECT" in action.upper():
            return {
                **self.observe(),
                "result": "query_executed",
                "rows_affected": 0
            }

        return self.observe()

    def validate(self, action: str) -> bool:
        """Validate database action"""
        # Block dangerous operations
        dangerous_keywords = ["DROP", "TRUNCATE", "DELETE FROM users", "UPDATE users"]
        if any(keyword in action.upper() for keyword in dangerous_keywords):
            return False

        # Allow safe operations
        safe_keywords = ["SELECT", "INSERT", "CREATE TABLE"]
        return any(keyword in action.upper() for keyword in safe_keywords)

# ========== USAGE EXAMPLES ==========

if __name__ == "__main__":
    print("=" * 80)
    print("Protocol 0x1162 - Integration Examples")
    print("=" * 80)
    print()

    # Example 1: Control Plane Integration
    print("Example 1: Control Plane Integration")
    print("-" * 80)
    agent = ControlPlaneIntegratedAgent("Agent1")
    if agent.compiler_integration:
        result = agent.make_distributed_decision("coordinate action", ["Agent2", "Agent3"])
        print(f"Distributed decision: {result.get('action')}")
        print(f"Consensus score: {result.get('consensus_score', 0.0)}")
    else:
        print("Control Plane Compilers not available")
    print()

    # Example 2: File System Integration
    print("Example 2: File System Integration")
    print("-" * 80)
    fs_agent = AgentKernel("FileSystemAgent", environment=FileSystemEnvironment("."))
    result = fs_agent.make_decision("list files")
    print(f"Action: {result.get('action')}")
    print(f"Environment: {result.get('environment_state')}")
    print()

    # Example 3: API Integration
    print("Example 3: API Integration")
    print("-" * 80)
    api_agent = AgentKernel("APIAgent", environment=APIEnvironment("https://api.example.com"))
    result = api_agent.make_decision("check status")
    print(f"Action: {result.get('action')}")
    print(f"Environment: {result.get('environment_state')}")
    print()

    print("=" * 80)
