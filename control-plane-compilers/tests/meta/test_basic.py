#!/usr/bin/env python3
"""Basic self-modifying compiler tests"""

import unittest
from one2lv.compilers.meta import SelfModifyingCompiler

class TestMetaCompiler(unittest.TestCase):
    def test_compiler_initialization(self):
        compiler = SelfModifyingCompiler()
        self.assertIsNotNone(compiler)

    def test_compiler_status(self):
        compiler = SelfModifyingCompiler()
        status = compiler.get_compiler_status()
        self.assertIn("meta_system", status)

if __name__ == "__main__":
    unittest.main()
