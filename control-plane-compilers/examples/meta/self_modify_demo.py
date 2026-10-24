#!/usr/bin/env python3
"""Self-Modifying Compiler Demo"""

from one2lv.compilers.meta import SelfModifyingCompiler

# Create compiler
compiler = SelfModifyingCompiler()

# Self-modify
print("Self-Modifying Compiler Demo")
print("=" * 40)
print("Initial state:", compiler.get_compiler_status())

# Add kernel (simulated)
compiler.add_kernel("event_bus", "event_bus_kernel")
compiler.compile_current_system()

print("After compilation:", compiler.get_compiler_status())
