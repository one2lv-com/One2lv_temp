#!/usr/bin/env python3
"""Basic distributed compiler tests"""

import unittest
from one2lv.compilers.distributed import DistributedControlPlaneCompiler

class TestDistributedCompiler(unittest.TestCase):
    def test_compiler_initialization(self):
        compiler = DistributedControlPlaneCompiler()
        self.assertIsNotNone(compiler)

    def test_system_status(self):
        compiler = DistributedControlPlaneCompiler()
        status = compiler.get_system_status()
        self.assertIn("compiler", status)

if __name__ == "__main__":
    unittest.main()
