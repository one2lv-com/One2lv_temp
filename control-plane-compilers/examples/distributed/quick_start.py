#!/usr/bin/env python3
"""Distributed Compiler Quick Start Example"""

from one2lv.compilers.distributed import DistributedControlPlaneCompiler

# Create compiler
compiler = DistributedControlPlaneCompiler()

# Example usage
print("Distributed Compiler Example")
print("=" * 40)
print("Status:", compiler.get_system_status())
print("Ready to compile agent fragments...")
