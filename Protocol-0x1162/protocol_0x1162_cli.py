#!/usr/bin/env python3
"""
Protocol 0x1162 CLI - Command-line interface for agent runtime
"""

import argparse
import json
import sys
from protocol_0x1162_runtime_v3 import AgentKernel, ConstraintType

def main():
    parser = argparse.ArgumentParser(
        description="Protocol 0x1162 - Production Agent Runtime",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode
  protocol-0x1162 interactive

  # Single decision
  protocol-0x1162 decide "adjust temperature"

  # Run tests
  protocol-0x1162 test

  # Show agent status
  protocol-0x1162 status --agent my_agent
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Interactive mode
    interactive_parser = subparsers.add_parser("interactive", help="Start interactive agent session")
    interactive_parser.add_argument("--agent-name", default="One2lv_Agent", help="Name for the agent")

    # Decide command
    decide_parser = subparsers.add_parser("decide", help="Make a single decision")
    decide_parser.add_argument("question", help="Question or task for the agent")
    decide_parser.add_argument("--agent-name", default="One2lv_Agent", help="Name for the agent")
    decide_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Test command
    test_parser = subparsers.add_parser("test", help="Run unit tests")
    test_parser.add_argument("--verbose", action="store_true", help="Verbose output")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show agent status")
    status_parser.add_argument("--agent-name", default="One2lv_Agent", help="Name for the agent")

    # Version command
    version_parser = subparsers.add_parser("version", help="Show version information")

    args = parser.parse_args()

    if args.command == "interactive":
        run_interactive(args.agent_name)
    elif args.command == "decide":
        run_decide(args.agent_name, args.question, args.json)
    elif args.command == "test":
        run_tests(args.verbose)
    elif args.command == "status":
        run_status(args.agent_name)
    elif args.command == "version":
        print_version()
    else:
        parser.print_help()

def run_interactive(agent_name: str):
    """Interactive agent session"""
    print("=" * 80)
    print(f"Protocol 0x1162 - Interactive Mode")
    print(f"Agent: {agent_name}")
    print("=" * 80)
    print()
    print("Commands:")
    print("  decide <question>  - Make a decision")
    print("  status             - Show agent status")
    print("  context <id>       - Show causal context")
    print("  chain <id>         - Show causal chain")
    print("  reset              - Reset agent")
    print("  exit               - Exit interactive mode")
    print()

    agent = AgentKernel(agent_name)

    while True:
        try:
            user_input = input(f"{agent_name}> ").strip()

            if not user_input:
                continue

            if user_input.lower() == "exit":
                print("Goodbye!")
                break

            if user_input.lower() == "status":
                print_agent_status(agent)
                continue

            if user_input.lower() == "reset":
                agent = AgentKernel(agent_name)
                print("Agent reset.")
                continue

            if user_input.lower().startswith("context "):
                decision_id = user_input.split()[1]
                context = agent.get_causal_context(decision_id)
                print(f"Causal context: {len(context)} decisions")
                for trace in context:
                    print(f"  - {trace.decision_id}: {trace.surface}")
                continue

            if user_input.lower().startswith("chain "):
                decision_id = user_input.split()[1]
                chain = agent.get_causal_chain(decision_id)
                print(f"Causal chain: {len(chain)} decisions")
                for i, trace in enumerate(chain, 1):
                    print(f"  {i}. {trace.decision_id}: {trace.surface}")
                continue

            if user_input.lower().startswith("decide "):
                question = user_input[7:]
            else:
                question = user_input

            # Make decision
            print(f"\nProcessing: {question}")
            print("-" * 80)

            result = agent.make_decision(question)

            if "error" in result:
                print(f"❌ Error: {result['error']}")
                if "violations" in result:
                    print("Violations:")
                    for v in result["violations"]:
                        print(f"  - {v}")
            else:
                print(f"✅ Action: {result['action']}")
                print(f"   Decision ID: {result['decision_id']}")
                print(f"   Responsibility: {result['responsibility_status']}")
                print(f"   Confidence: {result['confidence']:.2f}")
                print(f"   Environment state:")
                for k, v in result['environment_state'].items():
                    print(f"     {k}: {v}")

            print()

        except KeyboardInterrupt:
            print("\nUse 'exit' to quit")
        except Exception as e:
            print(f"Error: {e}")

def run_decide(agent_name: str, question: str, as_json: bool):
    """Make a single decision"""
    agent = AgentKernel(agent_name)
    result = agent.make_decision(question)

    if as_json:
        # Remove non-serializable trace object
        output = {k: v for k, v in result.items() if k != "trace"}
        print(json.dumps(output, indent=2))
    else:
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            if "violations" in result:
                print("Violations:")
                for v in result["violations"]:
                    print(f"  - {v}")
            sys.exit(1)
        else:
            print(f"Action: {result['action']}")
            print(f"Decision ID: {result['decision_id']}")
            print(f"Responsibility: {result['responsibility_status']}")
            print(f"Confidence: {result['confidence']:.2f}")

def run_tests(verbose: bool):
    """Run unit tests"""
    import subprocess
    cmd = ["python3", "test_protocol_0x1162.py"]
    if verbose:
        cmd.append("-v")
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

def run_status(agent_name: str):
    """Show agent status"""
    agent = AgentKernel(agent_name)
    print_agent_status(agent)

def print_agent_status(agent: AgentKernel):
    """Print agent status"""
    print()
    print("=" * 80)
    print(f"Agent Status: {agent.name}")
    print("=" * 80)
    print(f"Constraints: {len(agent.constraint_engine.constraints)}")
    for c_id, constraint in agent.constraint_engine.constraints.items():
        print(f"  - {c_id}: {constraint.type.value} ({constraint.weight})")
    print(f"Decisions made: {len(agent.state['memory'])}")
    print(f"Causal links: {len(agent.causal_engine.links)}")
    print(f"Environment state:")
    for k, v in agent.state['environment_state'].items():
        print(f"  {k}: {v}")
    print("=" * 80)
    print()

def print_version():
    """Print version information"""
    print("Protocol 0x1162 - Production Runtime v3")
    print("Version: 3.0.0")
    print("Python version: " + sys.version)
    print()
    print("Components:")
    print("  - AgentKernel")
    print("  - ConstraintEngine")
    print("  - CausalEngine")
    print("  - ResponsibilityEvaluator")
    print("  - EnvironmentInterface")

if __name__ == "__main__":
    main()
