#!/usr/bin/env python3
"""
Unit tests for Protocol 0x1162 Runtime v3
Tests constraint enforcement, causal reasoning, and execution grounding
"""

import unittest
import json
from protocol_0x1162_runtime_v3 import (
    AgentKernel, Constraint, ConstraintType, ConstraintEngine,
    CausalEngine, CausalLink, DecisionTrace, MockEnvironment,
    ResponsibilityEvaluator, StateSnapshot
)

class TestConstraintEngine(unittest.TestCase):
    """Test constraint enforcement system"""

    def setUp(self):
        self.engine = ConstraintEngine()

    def test_add_constraint(self):
        """Test adding constraints"""
        constraint = Constraint(
            id="test1",
            description="Test constraint",
            type=ConstraintType.HARD,
            evaluator=lambda s: s.get("value", 0) > 0
        )
        result = self.engine.add_constraint(constraint)
        self.assertTrue(result)
        self.assertIn("test1", self.engine.constraints)

    def test_evaluate_pass(self):
        """Test constraint evaluation - passing"""
        self.engine.add_constraint(Constraint(
            id="positive",
            description="Value must be positive",
            type=ConstraintType.HARD,
            evaluator=lambda s: s.get("value", 0) > 0
        ))

        is_valid, result = self.engine.evaluate({"value": 10})
        self.assertTrue(is_valid)
        self.assertEqual(result["confidence"], 1.0)

    def test_evaluate_fail(self):
        """Test constraint evaluation - failing"""
        self.engine.add_constraint(Constraint(
            id="positive",
            description="Value must be positive",
            type=ConstraintType.HARD,
            evaluator=lambda s: s.get("value", 0) > 0,
            violation_message="Value is not positive"
        ))

        is_valid, result = self.engine.evaluate({"value": -5})
        self.assertFalse(is_valid)
        self.assertIn("Value is not positive", result["violations"])

    def test_constraint_composition(self):
        """Test constraint composition"""
        c1 = Constraint(
            id="c1",
            description="Test 1",
            type=ConstraintType.HARD,
            evaluator=lambda s: s.get("a", 0) > 0
        )
        c2 = Constraint(
            id="c2",
            description="Test 2",
            type=ConstraintType.HARD,
            evaluator=lambda s: s.get("b", 0) > 0
        )

        and_c = self.engine.and_constraint(c1, c2)
        self.assertTrue(and_c.evaluator({"a": 1, "b": 1}))
        self.assertFalse(and_c.evaluator({"a": 1, "b": -1}))

class TestCausalEngine(unittest.TestCase):
    """Test causal reasoning system"""

    def setUp(self):
        self.engine = CausalEngine()

    def test_add_decision(self):
        """Test adding decision to causal graph"""
        trace = DecisionTrace(
            decision_id="test1",
            surface="Test decision",
            constraints=[],
            system_risks=[],
            behavioral_impacts=[],
            meta_implications=[],
            responsibility_anchors=[]
        )

        self.engine.add_decision(trace)
        self.assertIn("test1", self.engine.decision_history)

    def test_causal_links(self):
        """Test causal link tracking"""
        trace1 = DecisionTrace(
            decision_id="test1",
            surface="Decision 1",
            constraints=[],
            system_risks=[],
            behavioral_impacts=[],
            meta_implications=[],
            responsibility_anchors=[]
        )

        trace2 = DecisionTrace(
            decision_id="test2",
            surface="Decision 2",
            constraints=[],
            system_risks=[],
            behavioral_impacts=[],
            meta_implications=[],
            responsibility_anchors=[],
            causal_links=[CausalLink("test1", "test2", "causes")]
        )

        self.engine.add_decision(trace1)
        self.engine.add_decision(trace2)

        context = self.engine.get_causal_context("test2")
        self.assertEqual(len(context), 1)
        self.assertEqual(context[0].decision_id, "test1")

class TestMockEnvironment(unittest.TestCase):
    """Test environment interface"""

    def setUp(self):
        self.env = MockEnvironment()

    def test_observe(self):
        """Test state observation"""
        state = self.env.observe()
        self.assertIn("temperature", state)
        self.assertIn("energy", state)

    def test_act(self):
        """Test action execution"""
        initial_temp = self.env.state["temperature"]
        self.env.act("increase temperature")
        new_temp = self.env.state["temperature"]
        self.assertGreater(new_temp, initial_temp)

    def test_validate(self):
        """Test action validation"""
        self.assertTrue(self.env.validate("increase temperature"))
        self.assertFalse(self.env.validate("invalid action"))

    def test_snapshots(self):
        """Test state snapshots"""
        initial_state = self.env.state.copy()
        snapshot = self.env.take_snapshot()

        self.env.act("increase temperature")
        self.assertNotEqual(self.env.state["temperature"], initial_state["temperature"])

        self.env.rollback(snapshot.id)
        self.assertEqual(self.env.state["temperature"], initial_state["temperature"])

class TestResponsibilityEvaluator(unittest.TestCase):
    """Test responsibility evaluation"""

    def test_generate_anchors(self):
        """Test anchor generation"""
        anchors = ResponsibilityEvaluator.generate_anchors("delete file")
        self.assertEqual(len(anchors), 4)
        self.assertTrue(any("physical laws" in a for a in anchors))

    def test_evaluate_decision(self):
        """Test decision evaluation"""
        trace = DecisionTrace(
            decision_id="test",
            surface="Test",
            constraints=[Constraint(
                id="safe",
                description="Safety",
                type=ConstraintType.HARD,
                evaluator=lambda s: True
            )],
            system_risks=[],
            behavioral_impacts=[],
            meta_implications=[],
            responsibility_anchors=["Test anchor"],
            posterior_state={}
        )

        is_responsible, reason = ResponsibilityEvaluator.evaluate_decision(trace)
        self.assertTrue(is_responsible)

class TestAgentKernel(unittest.TestCase):
    """Test complete agent system"""

    def setUp(self):
        self.agent = AgentKernel("TestAgent")

    def test_initialization(self):
        """Test agent initialization"""
        self.assertIsNotNone(self.agent.constraint_engine)
        self.assertIsNotNone(self.agent.causal_engine)
        self.assertIsNotNone(self.agent.environment)

    def test_surface_check(self):
        """Test surface validation"""
        self.assertTrue(self.agent.surface_check("valid input"))
        self.assertFalse(self.agent.surface_check("!invalid"))

    def test_constraint_initialization(self):
        """Test default constraints"""
        self.assertGreater(len(self.agent.constraint_engine.constraints), 0)
        self.assertIn("physical_safety", self.agent.constraint_engine.constraints)

    def test_decision_generation(self):
        """Test candidate action generation"""
        actions = self.agent._generate_candidate_actions("temperature")
        self.assertGreater(len(actions), 0)
        self.assertTrue(any("temperature" in a for a in actions))

def run_all_tests():
    """Run all test suites"""
    print("=" * 80)
    print("PROTOCOL 0x1162 - Unit Test Suite")
    print("=" * 80)
    print()

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestConstraintEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestCausalEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestMockEnvironment))
    suite.addTests(loader.loadTestsFromTestCase(TestResponsibilityEvaluator))
    suite.addTests(loader.loadTestsFromTestCase(TestAgentKernel))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("=" * 80)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print("=" * 80)

    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
