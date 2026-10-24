"""
One2lvOS AI Engine V4
Adaptive Legend Switching System with Persistent Memory
"""

import json
import time
from datetime import datetime

MEM_PATH = "memory.json"

# Legend Database
LEGENDS = {
    "Queen Nai": {
        "style": "aggressive",
        "strengths": ["fast_attacks", "close_range", "momentum"],
        "weaknesses": ["recovery", "range"],
        "best_for": ["aggressive", "rushdown"]
    },
    "Fate": {
        "style": "technical",
        "strengths": ["versatility", "neutral_game", "reads"],
        "weaknesses": ["burst_damage"],
        "best_for": ["predictable", "patient"]
    },
    "Wu Shang": {
        "style": "balanced",
        "strengths": ["speed", " punish", "dexterity"],
        "weaknesses": ["raw_power"],
        "best_for": ["balanced", "adaptive"]
    },
    "Thor": {
        "style": "power",
        "strengths": ["damage", "edge_guards", " reads"],
        "weaknesses": ["speed", "approach"],
        "best_for": ["patient", "punish_heavy"]
    },
    "Asuri": {
        "style": "speed",
        "strengths": ["combo_game", "approach", " evasion"],
        "weaknesses": ["percentage"],
        "best_for": ["aggressive", "combo_heavy"]
    }
}

# Style thresholds
THRESHOLDS = {
    "aggression": 0.6,
    "variety": 0.7,
    "pace": 0.7,
    "predictable": 0.3
}


def load_memory():
    """Load memory from JSON file"""
    try:
        with open(MEM_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return _get_default_memory()


def save_memory(mem):
    """Save memory to JSON file"""
    with open(MEM_PATH, "w") as f:
        json.dump(mem, f, indent=2)


def _get_default_memory():
    """Get default memory structure"""
    return {
        "legend": "Fate",
        "last_style": "balanced",
        "current_vector": {
            "aggression": 0.5,
            "variety": 0.5,
            "pace": 0.5,
            "risk_taking": 0.5,
            "recovery_speed": 0.5
        },
        "history": [],
        "learning": {
            "aggressive_count": 0,
            "predictable_count": 0,
            "balanced_count": 0,
            "total_updates": 0
        },
        "ai_state": {
            "mood": "focused",
            "confidence": 0.8,
            "adaptation_level": 1
        },
        "system": {
            "version": "4.0",
            "last_updated": None,
            "uptime": 0
        }
    }


class LumenisCore:
    """AI Engine Core with adaptive learning"""

    def __init__(self):
        self.mem = load_memory()
        self.start_time = time.time()

    def classify(self, vector):
        """
        Classify player style based on input vector
        Returns: 'aggressive', 'predictable', or 'balanced'
        """
        aggression = vector.get("aggression", 0.5)
        variety = vector.get("variety", 0.5)
        pace = vector.get("pace", 0.5)
        risk_taking = vector.get("risk_taking", 0.5)

        # Classification logic
        if aggression > THRESHOLDS["aggression"] and pace > THRESHOLDS["pace"]:
            return "aggressive"

        if variety < THRESHOLDS["predictable"] and risk_taking < 0.4:
            return "predictable"

        return "balanced"

    def choose_legend(self, style, vector=None):
        """
        Choose optimal legend based on detected style
        Returns: legend name string
        """
        if style == "aggressive":
            # High aggression: rushdown legends
            if vector and vector.get("risk_taking", 0.5) > 0.7:
                return "Asuri"
            return "Queen Nai"

        if style == "predictable":
            # Predictable/neutral: technical legend
            return "Fate"

        # Balanced: versatile legend
        return "Wu Shang"

    def analyze_trends(self):
        """Analyze learning data to detect patterns"""
        learning = self.mem.get("learning", {})
        total = learning.get("total_updates", 1)

        aggressive_pct = learning.get("aggressive_count", 0) / total
        predictable_pct = learning.get("predictable_count", 0) / total
        balanced_pct = learning.get("balanced_count", 0) / total

        # Detect if player is improving
        recent_history = self.mem.get("history", [])[-10:]
        if len(recent_history) >= 5:
            first_five = recent_history[:5]
            last_five = recent_history[-5:]
            style_changes = sum(
                1 for i in range(len(first_five) - 1)
                if first_five[i]["style"] != first_five[i + 1]["style"]
            )
            adaptation_score = style_changes / 5
        else:
            adaptation_score = 0.5

        return {
            "aggressive_pct": round(aggressive_pct * 100, 1),
            "predictable_pct": round(predictable_pct * 100, 1),
            "balanced_pct": round(balanced_pct * 100, 1),
            "dominant_style": max(
                [("aggressive", aggressive_pct),
                 ("predictable", predictable_pct),
                 ("balanced", balanced_pct)],
                key=lambda x: x[1]
            )[0],
            "adaptation_score": round(adaptation_score, 2)
        }

    def update_ai_state(self, style, trends):
        """Update AI mood and confidence based on player behavior"""
        ai_state = self.mem.get("ai_state", {})

        # Mood based on style changes
        if trends["adaptation_score"] > 0.6:
            ai_state["mood"] = "adaptive"
            ai_state["confidence"] = 0.9
        elif trends["dominant_style"] == "aggressive":
            ai_state["mood"] = "defensive"
            ai_state["confidence"] = 0.7
        elif trends["dominant_style"] == "predictable":
            ai_state["mood"] = "opportunistic"
            ai_state["confidence"] = 0.75
        else:
            ai_state["mood"] = "focused"
            ai_state["confidence"] = 0.8

        # Adaptation level based on total updates
        learning = self.mem.get("learning", {})
        total = learning.get("total_updates", 0)
        ai_state["adaptation_level"] = min(10, max(1, total // 10 + 1))

        return ai_state

    def update(self, vector):
        """
        Main update function - process input and adapt
        Returns: updated memory dict
        """
        # Store current vector
        self.mem["current_vector"] = vector

        # Classify style
        style = self.classify(vector)

        # Get legend recommendation
        legend = self.choose_legend(style, vector)

        # Update stats
        style_key = f"{style}_count"
        if style_key not in self.mem["learning"]:
            self.mem["learning"][style_key] = 0
        self.mem["learning"][style_key] += 1
        self.mem["learning"]["total_updates"] += 1

        # Analyze trends
        trends = self.analyze_trends()

        # Update AI state
        ai_state = self.update_ai_state(style, trends)

        # Add to history
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "time_unix": time.time(),
            "style": style,
            "legend": legend,
            "vector": vector.copy(),
            "mood": ai_state["mood"],
            "confidence": ai_state["confidence"]
        }

        self.mem["history"].append(history_entry)

        # Keep only last 100 entries
        if len(self.mem["history"]) > 100:
            self.mem["history"] = self.mem["history"][-100:]

        # Update current values
        self.mem["last_style"] = style
        self.mem["legend"] = legend
        self.mem["ai_state"] = ai_state

        # Update system stats
        self.mem["system"]["last_updated"] = datetime.now().isoformat()
        self.mem["system"]["uptime"] = int(time.time() - self.start_time)

        # Save to file
        save_memory(self.mem)

        return self.get_state()

    def get_state(self):
        """Get current AI state with trends"""
        trends = self.analyze_trends()
        return {
            **self.mem.copy(),
            "trends": trends,
            "legend_info": LEGENDS.get(self.mem.get("legend", "Fate"), {})
        }

    def reset(self):
        """Reset memory to default state"""
        self.mem = _get_default_memory()
        save_memory(self.mem)
        return self.get_state()

    def force_legend(self, legend_name):
        """Manually set a legend"""
        if legend_name in LEGENDS:
            self.mem["legend"] = legend_name
            save_memory(self.mem)
            return {"success": True, "legend": legend_name}
        return {"success": False, "error": "Legend not found"}

    def get_legend_info(self, legend_name=None):
        """Get information about a legend"""
        if legend_name:
            return LEGENDS.get(legend_name, {})
        return LEGENDS


# Singleton instance
ai_core = LumenisCore()
