"""
One2lvOS Dashboard Server V4
Flask Backend with AI Engine Integration
"""

from flask import Flask, jsonify, request, send_from_directory
import os
from engine import ai_core, LEGENDS

app = Flask(__name__, static_folder='static')

# ==================== ROUTES ====================

@app.route("/")
def home():
    """Serve main dashboard"""
    return send_from_directory('static', 'index.html')


@app.route("/update", methods=["POST"])
def update():
    """
    Update AI with new input vector
    Expects JSON: {"aggression": 0.5, "variety": 0.5, ...}
    """
    try:
        vector = request.get_json()
        if not vector:
            return jsonify({"error": "No data provided"}), 400

        result = ai_core.update(vector)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/state")
def state():
    """Get current AI state"""
    return jsonify(ai_core.get_state())


@app.route("/trends")
def trends():
    """Get learning trends analysis"""
    return jsonify(ai_core.analyze_trends())


@app.route("/history")
def history():
    """Get history (optionally limited)"""
    limit = request.args.get('limit', 20, type=int)
    state = ai_core.get_state()
    history = state.get("history", [])[-limit:]
    return jsonify(history)


@app.route("/legend/<legend_name>")
def legend_info(legend_name):
    """Get information about a specific legend"""
    if legend_name in LEGENDS:
        return jsonify(LEGENDS[legend_name])
    return jsonify({"error": "Legend not found"}), 404


@app.route("/legends")
def all_legends():
    """Get all available legends"""
    return jsonify(ai_core.get_legend_info())


@app.route("/reset", methods=["POST"])
def reset():
    """Reset AI memory to default state"""
    result = ai_core.reset()
    return jsonify(result)


@app.route("/force_legend", methods=["POST"])
def force_legend():
    """Manually set a legend"""
    data = request.get_json()
    legend_name = data.get("legend")
    if legend_name:
        result = ai_core.force_legend(legend_name)
        return jsonify(result)
    return jsonify({"error": "No legend specified"}), 400


@app.route("/ai_state")
def ai_state():
    """Get AI internal state"""
    state = ai_core.get_state()
    return jsonify({
        "mood": state.get("ai_state", {}).get("mood", "unknown"),
        "confidence": state.get("ai_state", {}).get("confidence", 0),
        "adaptation_level": state.get("ai_state", {}).get("adaptation_level", 1)
    })


@app.route("/vector", methods=["POST"])
def update_vector():
    """Update only the input vector without triggering legend switch"""
    data = request.get_json()
    if data:
        ai_core.mem["current_vector"] = data
        from engine import save_memory
        save_memory(ai_core.mem)
        return jsonify({"success": True, "vector": data})
    return jsonify({"error": "No vector provided"}), 400


# ==================== MOCK INPUT (FOR TESTING) ====================

@app.route("/mock_input", methods=["POST"])
def mock_input():
    """
    Generate mock input vector for testing
    Can randomize or follow patterns
    """
    import random

    mode = request.args.get('mode', 'random')

    if mode == 'aggressive':
        vector = {
            "aggression": random.uniform(0.7, 1.0),
            "variety": random.uniform(0.3, 0.6),
            "pace": random.uniform(0.7, 1.0),
            "risk_taking": random.uniform(0.6, 0.9),
            "recovery_speed": random.uniform(0.3, 0.5)
        }
    elif mode == 'passive':
        vector = {
            "aggression": random.uniform(0.1, 0.3),
            "variety": random.uniform(0.2, 0.4),
            "pace": random.uniform(0.2, 0.4),
            "risk_taking": random.uniform(0.1, 0.3),
            "recovery_speed": random.uniform(0.6, 0.8)
        }
    else:  # random
        vector = {
            "aggression": random.uniform(0.2, 0.8),
            "variety": random.uniform(0.3, 0.8),
            "pace": random.uniform(0.3, 0.8),
            "risk_taking": random.uniform(0.2, 0.7),
            "recovery_speed": random.uniform(0.3, 0.7)
        }

    return jsonify(ai_core.update(vector))


# ==================== STATIC FILES ====================

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory('static', filename)


# ==================== HEALTH ====================

@app.route("/health")
def health():
    return jsonify({
        "status": "healthy",
        "version": "4.0",
        "system": "One2lvOS Dashboard"
    })


# ==================== MAIN ====================

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════╗
║         ONE2LVOS DASHBOARD v4              ║
╠════════════════════════════════════════════╣
║  🌐 Dashboard:  http://localhost:8080      ║
║  📡 API:        http://localhost:8080/api  ║
║  🧠 AI Engine:  READY                      ║
║  💾 Memory:     PERSISTENT                 ║
╚════════════════════════════════════════════╝
    """)

    # Ensure static directory exists
    os.makedirs('static', exist_ok=True)

    # Run server
    app.run(host='0.0.0.0', port=8080, debug=False)
