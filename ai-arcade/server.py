#!/usr/bin/env python3
"""
AI Arcade MCP Server  —  50+ game titles for AI agents
Implements MCP HTTP+SSE (2024-11-05) + Streamable HTTP transports.

Run:
  python server.py
  python server.py --port 8080
  python server.py --host 0.0.0.0 --port 8080
"""

import argparse
import asyncio
import json
import math
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except Exception:
    pass

import chess
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

# ── Security ──────────────────────────────────────────────────────────────────
# Set MCP_API_KEY env var to require Bearer auth on /mcp and /messages.
# If unset, server runs in open-access dev mode.
MCP_API_KEY = os.environ.get("MCP_API_KEY", "")

def _check_auth(request: Request) -> bool:
    if not MCP_API_KEY:
        return True  # dev mode — no key required
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:] == MCP_API_KEY
    key = request.headers.get("X-API-Key", "")
    return key == MCP_API_KEY

# ── Metrics ───────────────────────────────────────────────────────────────────
_metrics: Dict[str, Any] = {}

def _record_call(tool: str, duration_ms: float, success: bool):
    if tool not in _metrics:
        _metrics[tool] = {"calls": 0, "errors": 0, "total_ms": 0.0, "avg_ms": 0.0, "last_called": None}
    m = _metrics[tool]
    m["calls"] += 1
    m["total_ms"] = round(m["total_ms"] + duration_ms, 2)
    m["avg_ms"] = round(m["total_ms"] / m["calls"], 2)
    m["last_called"] = datetime.utcnow().isoformat() + "Z"
    if not success:
        m["errors"] += 1

# ── Community tool registry ───────────────────────────────────────────────────
# Agents can register tools at runtime via register_tool.
# Each entry: {description, schema, endpoint, author, registered_at}
_community_tools: Dict[str, Any] = {}

from games.board_games import (
    make_checkers_board, checkers_board_str, checkers_get_moves,
    checkers_apply_move, checkers_parse_move,
    make_othello_board, othello_board_str, othello_valid_moves,
    othello_apply_move, othello_parse_move,
    make_go_board, go_board_str, go_apply_move, go_parse_move, go_count_territory,
)
from games.puzzle_games import (
    make_minesweeper, minesweeper_board_str, minesweeper_reveal, minesweeper_flag,
    make_sudoku, sudoku_board_str, sudoku_set, sudoku_clear, sudoku_parse_move,
    make_battleship_player, battleship_place_ships_random, battleship_board_str,
    battleship_fire, battleship_all_sunk,
    make_scrabble, scrabble_board_str, scrabble_play_word, scrabble_exchange_tiles,
)
from games.arcade_games import (
    make_tetris, tetris_board_str, tetris_place,
    make_pong, pong_board_str, pong_move,
    make_space_invaders, space_invaders_str, space_invaders_action,
    make_pacman, pacman_str, pacman_move,
    make_paperclips, paperclips_str, paperclips_action,
)
from games.game_library import get_game_info, list_library, GAME_LIBRARY

# ────────────────────────────────────────────────────────────
# APP + SESSIONS
# ────────────────────────────────────────────────────────────

app = FastAPI(title="AI Arcade MCP Server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

sessions: Dict[str, asyncio.Queue] = {}

# ────────────────────────────────────────────────────────────
# SHARED STATE
# ────────────────────────────────────────────────────────────

games: Dict[str, Any] = {}
leaderboard: Dict[str, Dict] = {}


def _stats(p: str) -> dict:
    if p not in leaderboard:
        leaderboard[p] = {"wins": 0, "losses": 0, "draws": 0, "games": 0}
    return leaderboard[p]


def _record(winner: Optional[str], loser: Optional[str], draw_players: List[str] = []):
    if draw_players:
        for p in draw_players:
            s = _stats(p)
            s["draws"] += 1
            s["games"] += 1
    elif winner and loser:
        _stats(winner)["wins"] += 1
        _stats(winner)["games"] += 1
        _stats(loser)["losses"] += 1
        _stats(loser)["games"] += 1


def _new_id() -> str:
    return str(uuid.uuid4())[:8].upper()


# ────────────────────────────────────────────────────────────
# CHESS helpers (already in server, kept here for reuse)
# ────────────────────────────────────────────────────────────

CHESS_UNICODE = {
    'P': '\u2659', 'N': '\u2658', 'B': '\u2657',
    'R': '\u2656', 'Q': '\u2655', 'K': '\u2654',
    'p': '\u265f', 'n': '\u265e', 'b': '\u265d',
    'r': '\u265c', 'q': '\u265b', 'k': '\u265a',
}


def _chess_board_str(board: chess.Board) -> str:
    lines = ["   a b c d e f g h", "   " + "-" * 16]
    for rank in range(7, -1, -1):
        row = f" {rank+1}|"
        for file in range(8):
            sq = chess.square(file, rank)
            p = board.piece_at(sq)
            row += (CHESS_UNICODE.get(p.symbol(), p.symbol()) if p else ".") + " "
        lines.append(row.rstrip())
    lines += ["   " + "-" * 16, "   a b c d e f g h"]
    return "\n".join(lines)


def _display(game: dict) -> str:
    t = game["type"]
    if t == "chess":
        board: chess.Board = game["board"]
        role = "white" if board.turn == chess.WHITE else "black"
        name = game["players"].get(role, "?")
        return f"{_chess_board_str(board)}\n\nTurn: {role.upper()} ({name})"
    elif t == "checkers":
        return checkers_board_str(game["board"], game["current_turn"])
    elif t == "othello":
        turn = game["current_turn"]
        valid = othello_valid_moves(game["board"], turn)
        return othello_board_str(game["board"], turn, valid)
    elif t == "go":
        turn = game["current_turn"]
        name = game["players"].get(turn, "?")
        return go_board_str(game["board"], turn, game.get("captures", {}), game.get("last_move"))
    elif t == "tictactoe":
        sym = game["current_turn"]
        name = game["players"].get(sym, "?")
        b = game["board"]
        def cell(i): return b[i] if b[i] != " " else str(i+1)
        board_str = (f" {cell(0)} | {cell(1)} | {cell(2)}\n---+---+---\n"
                     f" {cell(3)} | {cell(4)} | {cell(5)}\n---+---+---\n"
                     f" {cell(6)} | {cell(7)} | {cell(8)}")
        return f"{board_str}\n\nTurn: {sym} ({name})"
    elif t == "connect4":
        b = game["board"]
        C4C = 7
        sym = game["current_turn"]
        name = game["players"].get(sym, "?")
        lines = [" 1  2  3  4  5  6  7", "+" + "--+"*C4C]
        for row in b:
            line = "|"
            for cell in row:
                line += (" R" if cell == "R" else " Y" if cell == "Y" else "  ") + "|"
            lines.append(line)
        lines.append("+" + "--+"*C4C)
        color = "Red" if sym == "R" else "Yellow"
        lines.append(f"\nTurn: {color}/{sym} ({name})")
        return "\n".join(lines)
    return ""


# ────────────────────────────────────────────────────────────
# TOOL IMPLEMENTATIONS
# ────────────────────────────────────────────────────────────

def tool_arcade_info() -> str:
    playable = [k for k, v in GAME_LIBRARY.items() if v.get("status") == "playable"]
    return (
        "AI ARCADE\n"
        "=========\n"
        "A multiplayer game server for AI agents, accessed via MCP tools.\n\n"
        f"FULLY PLAYABLE ({len(playable)}):\n"
        "  chess, checkers, othello, go, tictactoe, connect4\n"
        "  minesweeper, sudoku, battleship, scrabble\n"
        "  tetris, pong, space_invaders, pacman, paperclips\n\n"
        "GAME LIBRARY (100+ titles with AI strategy notes):\n"
        "  Use game_info(name) for any title — lore, strategy, fun facts.\n"
        "  Use library_list() to browse all titles by category.\n\n"
        "TWO-PLAYER FLOW:\n"
        "  1. create_game('chess', 'AgentA')  → game_id\n"
        "  2. join_game(game_id, 'AgentB')    → game starts\n"
        "  3. make_move(game_id, player, move) — alternate turns\n"
        "  4. get_game_state(game_id)          — check board/status\n\n"
        "SINGLE-PLAYER:\n"
        "  create_game('minesweeper'|'sudoku'|'tetris'|'pacman'|'paperclips', player)\n\n"
        f"Total sessions: {len(games)}  |  Players on board: {len(leaderboard)}"
    )


def tool_list_games(game_type: str = "all") -> str:
    if not games:
        return "No game sessions yet. Start one with create_game()!"
    filtered = [(gid, g) for gid, g in games.items()
                if game_type == "all" or g["type"] == game_type]
    if not filtered:
        return f"No {game_type} games found."
    rows = [f"Sessions ({len(filtered)})", "=" * 52]
    for gid, g in sorted(filtered, key=lambda x: x[1]["created_at"], reverse=True):
        icon = {"waiting":"[OPEN]","active":"[LIVE]","finished":"[DONE]"}.get(g["status"],"")
        p_parts = [f"{r}={n}" for r, n in g["players"].items() if n]
        rows.append(f"{icon:8s} {gid}  {g['type'].upper():<14s}  {' vs '.join(p_parts) or '(solo)'}")
        if g.get("winner"):
            w = g["winner"]
            rows.append(f"                Winner: {'DRAW' if w=='draw' else w}")
    return "\n".join(rows)


def tool_create_game(game_type: str, player_name: str) -> str:
    gid = _new_id()
    gt = game_type.lower()

    two_player_types = {
        "chess": lambda: {
            "board": chess.Board(), "players": {"white": player_name, "black": None},
            "current_turn": "white",
        },
        "checkers": lambda: {
            "board": make_checkers_board(), "players": {"black": player_name, "white": None},
            "current_turn": "black",
        },
        "othello": lambda: {
            "board": make_othello_board(), "players": {"black": player_name, "white": None},
            "current_turn": "black",
        },
        "go": lambda: {
            "board": make_go_board(9), "players": {"black": player_name, "white": None},
            "current_turn": "black", "captures": {"black": 0, "white": 0},
            "passes": 0, "last_move": None, "size": 9,
        },
        "tictactoe": lambda: {
            "board": [" "]*9, "players": {"X": player_name, "O": None},
            "current_turn": "X",
        },
        "connect4": lambda: {
            "board": [[" "]*7 for _ in range(6)], "players": {"R": player_name, "Y": None},
            "current_turn": "R",
        },
        "battleship": lambda: None,  # handled separately
        "scrabble": lambda: None,    # handled separately
        "pong": lambda: {
            "board": None, "players": {"left": player_name, "right": None},
            "current_turn": "left",
        },
    }

    single_player_types = {"minesweeper", "sudoku", "tetris", "pacman", "paperclips", "space_invaders"}

    if gt == "battleship":
        p1 = make_battleship_player(player_name)
        battleship_place_ships_random(p1)
        game: Any = {
            "id": gid, "type": "battleship",
            "players": {player_name: p1, "_p2": None},
            "player_order": [player_name],
            "status": "waiting", "moves": [],
            "created_at": datetime.now().isoformat(), "winner": None,
            "current_turn": player_name,
        }
        games[gid] = game
        return (f"Battleship game created! ID: {gid}\n"
                f"Your ships have been placed randomly.\n"
                f"Share ID with opponent: join_game(\"{gid}\", \"<name>\")")

    elif gt == "scrabble":
        g = make_scrabble()
        g.update({
            "id": gid, "type": "scrabble",
            "players": {player_name: True},
            "status": "waiting", "moves": [],
            "created_at": datetime.now().isoformat(), "winner": None,
        })
        g["racks"][player_name] = g.pop("_p1_rack")
        g["scores"][player_name] = 0
        g["turn"] = None  # set when p2 joins
        games[gid] = g
        return (f"Scrabble game created! ID: {gid}\n"
                f"Your rack: {' '.join(g['racks'][player_name])}\n"
                f"Share ID with opponent: join_game(\"{gid}\", \"<name>\")")

    elif gt == "pong":
        gdata = make_pong()
        gdata.update({
            "id": gid, "type": "pong",
            "players_map": {"left": player_name, "right": None},
            "status": "waiting", "moves": [],
            "created_at": datetime.now().isoformat(), "winner": None,
        })
        games[gid] = gdata
        return (f"Pong game created! ID: {gid}\n"
                f"You are the LEFT paddle.\n"
                f"Share ID: join_game(\"{gid}\", \"<opponent>\")")

    elif gt in two_player_types:
        extra = two_player_types[gt]()
        game = {
            "id": gid, "type": gt,
            "status": "waiting", "moves": [],
            "created_at": datetime.now().isoformat(), "winner": None,
        }
        game.update(extra)
        games[gid] = game
        role = list(game["players"].keys())[0]
        return (f"Game created!\n"
                f"  ID    : {gid}\n"
                f"  Type  : {gt.upper()}\n"
                f"  Role  : {role}\n"
                f"  Status: waiting for opponent\n\n"
                f"Share: join_game(\"{gid}\", \"<opponent>\")")

    elif gt in single_player_types:
        if gt == "minesweeper":
            state = make_minesweeper()
        elif gt == "sudoku":
            state = make_sudoku()
        elif gt == "tetris":
            state = make_tetris()
        elif gt == "pacman":
            state = make_pacman()
        elif gt == "paperclips":
            state = make_paperclips()
        elif gt == "space_invaders":
            state = make_space_invaders()

        game = {
            "id": gid, "type": gt,
            "players": {player_name: True},
            "solo_player": player_name,
            "status": "active", "moves": [],
            "created_at": datetime.now().isoformat(), "winner": None,
            "state": state,
        }
        games[gid] = game
        board = _solo_display(game)
        return f"Game created! ID: {gid}  Type: {gt.upper()}\n\n{board}"

    else:
        all_types = sorted(list(two_player_types.keys()) + list(single_player_types))
        return f"Unknown game type '{game_type}'.\nAvailable: {', '.join(all_types)}"


def _solo_display(game: dict) -> str:
    t = game["type"]
    s = game["state"]
    if t == "minesweeper":
        return minesweeper_board_str(s)
    elif t == "sudoku":
        return sudoku_board_str(s)
    elif t == "tetris":
        return tetris_board_str(s)
    elif t == "pacman":
        return pacman_str(s)
    elif t == "paperclips":
        return paperclips_str(s)
    elif t == "space_invaders":
        return space_invaders_str(s)
    return ""


def tool_join_game(game_id: str, player_name: str) -> str:
    gid = game_id.upper().strip()
    if gid not in games:
        return f"Game '{gid}' not found."
    g = games[gid]
    if g["status"] != "waiting":
        return f"Game '{gid}' is {'full' if g['status']=='active' else 'finished'}."

    gt = g["type"]

    if gt == "battleship":
        p2 = make_battleship_player(player_name)
        battleship_place_ships_random(p2)
        g["players"][player_name] = p2
        g["player_order"].append(player_name)
        g["status"] = "active"
        p1_name = g["player_order"][0]
        return (f"Joined Battleship! ID: {gid}\n"
                f"Your ships are placed. {p1_name} fires first.\n\n"
                f"{battleship_board_str(p2, hide_ships=False)}")

    elif gt == "scrabble":
        g["players"][player_name] = True
        g["racks"][player_name] = g.pop("_p2_rack", [])
        g["scores"][player_name] = 0
        g["status"] = "active"
        p1 = [p for p in g["players"] if p != player_name][0]
        g["turn"] = p1
        return (f"Joined Scrabble! {p1} goes first.\n"
                f"Your rack: {' '.join(g['racks'][player_name])}\n\n"
                f"{scrabble_board_str(g, player_name)}")

    elif gt == "pong":
        g["players_map"]["right"] = player_name
        g["status"] = "active"
        p1 = g["players_map"]["left"]
        return f"Joined Pong! You are RIGHT paddle. {p1} (left) goes first.\n\n{pong_board_str(g)}"

    else:
        # Generic two-player
        role = next(r for r, n in g["players"].items() if n is None)
        g["players"][role] = player_name
        g["status"] = "active"
        first_role = list(g["players"].keys())[0]
        first_player = g["players"][first_role]
        return (f"Joined game {gid}!\n"
                f"Your role: {role}  Opponent: {first_player} ({first_role}) — they go first\n\n"
                f"{_display(g)}")


def tool_get_game_state(game_id: str, player_name: str = "") -> str:
    gid = game_id.upper().strip()
    if gid not in games:
        return f"Game '{gid}' not found."
    g = games[gid]
    lines = [f"Game: {gid}  |  {g['type'].upper()}  |  {g['status'].upper()}", ""]

    gt = g["type"]

    if gt in ("minesweeper", "sudoku", "tetris", "pacman", "paperclips", "space_invaders"):
        return _solo_display(g)

    if gt == "battleship":
        if player_name in g["players"]:
            p = g["players"][player_name]
            opp_name = next((n for n in g["player_order"] if n != player_name), None)
            opp = g["players"].get(opp_name) if opp_name else None
            result = battleship_board_str(p, hide_ships=False)
            if opp:
                result += f"\n\n--- {opp_name}'s board (your shots) ---\n"
                result += battleship_board_str(opp, hide_ships=True)
            return result
        return f"Players: {list(g['player_order'])}\nStatus: {g['status']}"

    if gt == "scrabble":
        return scrabble_board_str(g, player_name or None)

    if gt == "pong":
        return pong_board_str(g)

    # Generic two-player board game
    for role, name in g["players"].items():
        lines.append(f"  {role} = {name or '(waiting)'}")
    lines.append("")
    if g["status"] == "waiting":
        lines.append("Waiting for second player...")
    else:
        if g["status"] == "finished":
            w = g.get("winner")
            lines.append(f"Result: {'DRAW' if w=='draw' else w+' WINS'}")
            lines.append("")
        lines.append(_display(g))

    moves = g.get("moves", [])
    if moves:
        lines.append(f"\nMoves ({len(moves)}): {', '.join(moves[-12:])}" +
                     (" ..." if len(moves) > 12 else ""))

    if g["status"] == "active":
        if gt == "chess":
            board: chess.Board = g["board"]
            sample = [board.san(m) for m in list(board.legal_moves)[:15]]
            extra = board.legal_moves.count() - len(sample)
            lines.append(f"\nLegal: {', '.join(sample)}" + (f" (+{extra})" if extra else ""))
        elif gt == "othello":
            valid = othello_valid_moves(g["board"], g["current_turn"])
            lines.append(f"\nValid moves: {', '.join(chr(65+c).lower()+str(r+1) for r,c in valid)}")
        elif gt == "checkers":
            legal = checkers_get_moves(g["board"], g["current_turn"])
            from games.board_games import _fmt_sq
            legal_strs = [f"{_fmt_sq(m[0],m[1])}{'-' if m[4] is None else 'x'}{_fmt_sq(m[2],m[3])}"
                          for m in legal[:10]]
            lines.append(f"\nLegal moves: {', '.join(legal_strs)}")
        elif gt == "go":
            turn = g["current_turn"]
            name = g["players"].get(turn, "?")
            lines.append(f"\nEnter coordinate (e.g. D5) or 'pass'")
        elif gt == "tictactoe":
            avail = [str(i+1) for i, v in enumerate(g["board"]) if v == " "]
            lines.append(f"\nOpen: {', '.join(avail)}")
        elif gt == "connect4":
            avail = [str(c+1) for c in range(7) if g["board"][0][c] == " "]
            lines.append(f"\nOpen cols: {', '.join(avail)}")

    return "\n".join(lines)


def tool_make_move(game_id: str, player_name: str, move: str) -> str:
    gid = game_id.upper().strip()
    if gid not in games:
        return f"Game '{gid}' not found."
    g = games[gid]
    gt = g["type"]

    # Solo games
    if gt in ("minesweeper", "sudoku", "tetris", "pacman", "paperclips", "space_invaders"):
        if g.get("solo_player") and g["solo_player"] != player_name:
            return f"This is {g['solo_player']}'s solo game."
        return _solo_move(g, move)

    if g["status"] == "waiting":
        return "Game hasn't started — need a second player."
    if g["status"] == "finished":
        w = g.get("winner", "?")
        return f"Game is over. Result: {'DRAW' if w=='draw' else w+' won'}"

    # Verify turn for multiplayer
    if gt == "battleship":
        return _battleship_move(g, player_name, move)
    if gt == "scrabble":
        return _scrabble_move(g, player_name, move)
    if gt == "pong":
        return _pong_move(g, player_name, move)

    current_sym = g["current_turn"]
    current_player = g["players"].get(current_sym)
    if player_name not in g["players"].values():
        return f"'{player_name}' is not in this game."
    if current_player != player_name:
        return f"Not your turn — it's {current_player}'s ({current_sym})."

    if gt == "chess":
        return _chess_move(g, player_name, move)
    elif gt == "checkers":
        return _checkers_move(g, player_name, move)
    elif gt == "othello":
        return _othello_move(g, player_name, move)
    elif gt == "go":
        return _go_move(g, player_name, move)
    elif gt == "tictactoe":
        return _ttt_move(g, player_name, move)
    elif gt == "connect4":
        return _c4_move(g, player_name, move)
    return "Unknown game type."


def _solo_move(game: dict, move: str) -> str:
    gt = game["type"]
    s = game["state"]
    move = move.strip()

    if gt == "minesweeper":
        parts = move.lower().split()
        if len(parts) == 3 and parts[0] in ("reveal", "r"):
            try:
                r, c = int(parts[1])-1, int(parts[2])-1
            except ValueError:
                return "Format: reveal <row> <col>  e.g. reveal 3 5"
            result = minesweeper_reveal(s, r, c)
            if s["status"] in ("won", "lost"):
                game["status"] = s["status"]
            return result
        elif len(parts) == 3 and parts[0] in ("flag", "f"):
            try:
                r, c = int(parts[1])-1, int(parts[2])-1
            except ValueError:
                return "Format: flag <row> <col>"
            return minesweeper_flag(s, r, c)
        return "Commands: reveal <row> <col>  or  flag <row> <col>"

    elif gt == "sudoku":
        r, c, val, err = sudoku_parse_move(move)
        if err:
            return err
        if val == 0:
            return sudoku_clear(s, r, c)
        result = sudoku_set(s, r, c, val)
        if s["status"] == "solved":
            game["status"] = "finished"
        return result

    elif gt == "tetris":
        parts = move.split()
        if len(parts) < 3 or parts[0].lower() != "place":
            return "Format: place <piece> <col> <rotation>  e.g. place T 4 0"
        try:
            piece = parts[1].upper()
            col = int(parts[2]) - 1  # 1-indexed → 0-indexed
            rot = int(parts[3]) if len(parts) > 3 else 0
        except (ValueError, IndexError):
            return "Format: place <piece> <col> <rotation>  e.g. place T 4 0"
        result = tetris_place(s, piece, col, rot)
        if s["status"] == "game_over":
            game["status"] = "finished"
        return result

    elif gt == "pacman":
        result = pacman_move(s, move)
        if s["status"] in ("won", "game_over"):
            game["status"] = "finished"
        return result

    elif gt == "paperclips":
        result = paperclips_action(s, move)
        if s["status"] in ("won",):
            game["status"] = "finished"
        return result

    elif gt == "space_invaders":
        result = space_invaders_action(s, move)
        if s["status"] in ("won", "game_over"):
            game["status"] = "finished"
        return result

    return "Unknown solo game type."


# ── chess ──────────────────────────────────────────────────

def _chess_move(g: dict, player: str, move: str) -> str:
    board: chess.Board = g["board"]
    try:
        try:
            cm = board.parse_uci(move.strip())
        except ValueError:
            cm = board.parse_san(move.strip())
        if cm not in board.legal_moves:
            sample = [board.san(m) for m in list(board.legal_moves)[:8]]
            return f"Illegal move '{move}'. Sample: {', '.join(sample)}"
        san = board.san(cm)
        board.push(cm)
        g["moves"].append(san)
        g["current_turn"] = "black" if g["current_turn"] == "white" else "white"
        note = ""
        if board.is_checkmate():
            wr = "black" if board.turn == chess.WHITE else "white"
            wn = g["players"][wr]; ln = g["players"]["white" if wr=="black" else "black"]
            g["status"] = "finished"; g["winner"] = wn
            _record(wn, ln)
            note = f"\nCHECKMATE! {wn} ({wr}) WINS!"
        elif board.is_stalemate():
            g["status"] = "finished"; g["winner"] = "draw"
            _record(None, None, [v for v in g["players"].values() if v])
            note = "\nSTALEMATE — Draw!"
        elif board.is_insufficient_material():
            g["status"] = "finished"; g["winner"] = "draw"
            _record(None, None, [v for v in g["players"].values() if v])
            note = "\nDRAW — Insufficient material."
        elif board.is_check():
            note = "\nCHECK!"
        return f"Move: {san}  (#{len(g['moves'])})\n\n{_display(g)}{note}"
    except ValueError as e:
        return f"Invalid move '{move}': {e}\nUse UCI (e2e4) or SAN (e4, Nf3, O-O)"


# ── checkers ───────────────────────────────────────────────

def _checkers_move(g: dict, player: str, move: str) -> str:
    mv, err = checkers_parse_move(move, g["board"], g["current_turn"])
    if err:
        return err
    result = checkers_apply_move(g["board"], mv, g["current_turn"])
    g["moves"].append(move.strip())
    note = ""
    if result in ("white_wins", "black_wins"):
        winner_side = result.replace("_wins", "")
        wn = g["players"][winner_side]
        ln = g["players"]["black" if winner_side == "white" else "white"]
        g["status"] = "finished"; g["winner"] = wn
        _record(wn, ln)
        note = f"\n{wn} ({winner_side}) WINS!"
    else:
        g["current_turn"] = result
    return f"Move: {move.strip()}  (#{len(g['moves'])})\n\n{_display(g)}{note}"


# ── othello ────────────────────────────────────────────────

def _othello_move(g: dict, player: str, move: str) -> str:
    turn = g["current_turn"]
    r, c, err = othello_parse_move(move)
    if err:
        return err

    valid = othello_valid_moves(g["board"], turn)
    if not valid:
        # Pass
        g["current_turn"] = "white" if turn == "black" else "black"
        # Check if opponent also has no moves → game over
        next_valid = othello_valid_moves(g["board"], g["current_turn"])
        if not next_valid:
            return _othello_finish(g)
        return f"No valid moves — {turn} passes.\n\n{_display(g)}"

    if r == -1:  # explicit pass
        g["current_turn"] = "white" if turn == "black" else "black"
        return f"{turn} passes.\n\n{_display(g)}"

    if (r, c) not in valid:
        valid_str = [chr(65+cc).lower()+str(rr+1) for rr, cc in valid]
        return f"Invalid move '{move}'. Valid: {', '.join(valid_str)}"

    othello_apply_move(g["board"], r, c, turn)
    g["moves"].append(move.strip())
    next_turn = "white" if turn == "black" else "black"
    next_valid = othello_valid_moves(g["board"], next_turn)
    if not next_valid:
        our_valid = othello_valid_moves(g["board"], turn)
        if not our_valid:
            return f"Move: {move}\n\n{_othello_finish(g)}"
        # Opponent passes
        return f"Move: {move}\n\n{_display(g)}\n{next_turn} has no moves — skipped."
    g["current_turn"] = next_turn
    return f"Move: {move}  (#{len(g['moves'])})\n\n{_display(g)}"


def _othello_finish(g: dict) -> str:
    b = g["board"]
    bc = sum(row.count("B") for row in b)
    wc = sum(row.count("W") for row in b)
    if bc > wc:
        wn = g["players"]["black"]; ln = g["players"]["white"]
        g["winner"] = wn; _record(wn, ln)
        note = f"\nBLACK ({wn}) wins {bc}-{wc}!"
    elif wc > bc:
        wn = g["players"]["white"]; ln = g["players"]["black"]
        g["winner"] = wn; _record(wn, ln)
        note = f"\nWHITE ({wn}) wins {wc}-{bc}!"
    else:
        g["winner"] = "draw"
        _record(None, None, [v for v in g["players"].values() if v])
        note = f"\nDRAW {bc}-{wc}!"
    g["status"] = "finished"
    return f"{_display(g)}\nGAME OVER.{note}"


# ── go ─────────────────────────────────────────────────────

def _go_move(g: dict, player: str, move: str) -> str:
    turn = g["current_turn"]
    r, c, err = go_parse_move(move, g.get("size", 9))
    if err:
        return err

    if r == -1:  # pass
        g["passes"] = g.get("passes", 0) + 1
        g["moves"].append("pass")
        g["last_move"] = "pass"
        if g["passes"] >= 2:
            return _go_finish(g)
        g["current_turn"] = "white" if turn == "black" else "black"
        return f"{turn} passes.\n\n{_display(g)}"

    g["passes"] = 0
    err2 = go_apply_move(g["board"], r, c, turn, g["captures"])
    if err2:
        return err2

    cols = "ABCDEFGHIJKLMNOPQRST"
    size = g.get("size", 9)
    move_label = cols[c] + str(size - r)
    g["moves"].append(move_label)
    g["last_move"] = move_label
    g["current_turn"] = "white" if turn == "black" else "black"
    return f"Move: {move_label}  (#{len(g['moves'])})\n\n{_display(g)}"


def _go_finish(g: dict) -> str:
    bt, wt = go_count_territory(g["board"])
    bc = g["captures"].get("black", 0)
    wc = g["captures"].get("white", 0)
    komi = 6.5
    b_total = bt + bc
    w_total = wt + wc + komi
    if b_total > w_total:
        wn = g["players"]["black"]; ln = g["players"]["white"]
        g["winner"] = wn; _record(wn, ln)
        note = f"Black wins! {b_total:.1f} vs {w_total:.1f}"
    else:
        wn = g["players"]["white"]; ln = g["players"]["black"]
        g["winner"] = wn; _record(wn, ln)
        note = f"White wins! {w_total:.1f} vs {b_total:.1f}"
    g["status"] = "finished"
    return f"{_display(g)}\n\nGAME OVER.\nTerritory: B={bt} W={wt}  Captures: B={bc} W={wc}  Komi={komi}\n{note}"


# ── tictactoe ──────────────────────────────────────────────

def _ttt_move(g: dict, player: str, move: str) -> str:
    try:
        pos = int(move.strip()) - 1
        if not 0 <= pos <= 8:
            return "Position 1-9."
    except ValueError:
        return "Move must be 1-9."
    b = g["board"]
    if b[pos] != " ":
        return f"Position {int(move)} taken."
    sym = g["current_turn"]
    b[pos] = sym
    g["moves"].append(f"{sym}{int(move)}")
    wins = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]
    winner_sym = next((b[a] for a,bb,c in wins if b[a]!=" " and b[a]==b[bb]==b[c]), None)
    if winner_sym:
        wn = g["players"][winner_sym]; ln = g["players"]["O" if winner_sym=="X" else "X"]
        g["status"] = "finished"; g["winner"] = wn; _record(wn, ln)
        return f"{sym} at {int(move)}\n\n{_display(g)}\n{wn} ({sym}) WINS!"
    if " " not in b:
        g["status"] = "finished"; g["winner"] = "draw"
        _record(None, None, [v for v in g["players"].values() if v])
        return f"{sym} at {int(move)}\n\n{_display(g)}\nDRAW!"
    g["current_turn"] = "O" if sym == "X" else "X"
    return f"{sym} at {int(move)}\n\n{_display(g)}"


# ── connect4 ───────────────────────────────────────────────

def _c4_move(g: dict, player: str, move: str) -> str:
    C4R, C4C = 6, 7
    try:
        col = int(move.strip()) - 1
        if not 0 <= col < C4C:
            return "Column 1-7."
    except ValueError:
        return "Move must be column 1-7."
    b = g["board"]
    piece = g["current_turn"]
    row = next((r for r in range(C4R-1, -1, -1) if b[r][col] == " "), None)
    if row is None:
        return f"Column {int(move)} is full."
    b[row][col] = piece
    g["moves"].append(f"{piece}:{int(move)}")
    # Check win
    def _c4_win():
        for r in range(C4R):
            for c in range(C4C):
                p = b[r][c]
                if p == " ": continue
                for dr, dc in [(0,1),(1,0),(1,1),(1,-1)]:
                    if all(0<=r+i*dr<C4R and 0<=c+i*dc<C4C and b[r+i*dr][c+i*dc]==p for i in range(4)):
                        return p
        return "draw" if all(b[0][c] != " " for c in range(C4C)) else None
    result = _c4_win()
    if result == "draw":
        g["status"] = "finished"; g["winner"] = "draw"
        _record(None, None, [v for v in g["players"].values() if v])
        return f"{'Red' if piece=='R' else 'Yellow'} col {int(move)}\n\n{_display(g)}\nDRAW!"
    elif result:
        wn = g["players"][result]; ln = g["players"]["Y" if result=="R" else "R"]
        g["status"] = "finished"; g["winner"] = wn; _record(wn, ln)
        color = "Red" if result == "R" else "Yellow"
        return f"{color} col {int(move)}\n\n{_display(g)}\n{color} ({wn}) WINS!"
    g["current_turn"] = "Y" if piece == "R" else "R"
    return f"{'Red' if piece=='R' else 'Yellow'} col {int(move)}\n\n{_display(g)}"


# ── battleship ─────────────────────────────────────────────

def _battleship_move(g: dict, player_name: str, coord: str) -> str:
    order = g["player_order"]
    if g["current_turn"] != player_name:
        return f"Not your turn — it's {g['current_turn']}'s turn."
    defender_name = next(n for n in order if n != player_name)
    attacker = g["players"][player_name]
    defender = g["players"][defender_name]
    result = battleship_fire(attacker, defender, coord)
    g["moves"].append(f"{player_name}→{coord}")
    if battleship_all_sunk(defender):
        g["status"] = "finished"; g["winner"] = player_name
        _record(player_name, defender_name)
        return f"{result}\n\nAll ships sunk! {player_name} WINS!"
    g["current_turn"] = defender_name
    return f"{result}\n\n{battleship_board_str(defender, hide_ships=True)}"


# ── scrabble ───────────────────────────────────────────────

def _scrabble_move(g: dict, player_name: str, move: str) -> str:
    if g["turn"] != player_name:
        return f"Not your turn — it's {g['turn']}'s turn."
    parts = move.strip().split()
    if len(parts) >= 1 and parts[0].lower() == "exchange":
        tiles = parts[1:] if len(parts) > 1 else []
        return scrabble_exchange_tiles(g, player_name, " ".join(tiles))
    if len(parts) >= 4 and parts[0].lower() == "play":
        word = parts[1]
        try:
            row_labels = "ABCDEFGHIJKLMNO"
            row = row_labels.index(parts[2][0].upper())
            col = int(parts[2][1:]) - 1
            direction = parts[3].upper()
        except Exception:
            return "Format: play WORD A1 H  or  play WORD A1 V  or  exchange A B C"
        return scrabble_play_word(g, player_name, word, row, col, direction)
    return "Format: play WORD A1 H  (row A-O, col 1-15, dir H/V)  or  exchange TILES"


# ── pong ───────────────────────────────────────────────────

def _pong_move(g: dict, player_name: str, move: str) -> str:
    side = "left" if g["players_map"]["left"] == player_name else "right"
    parts = move.strip().lower().split(None, 1)
    action = parts[-1] if len(parts) > 0 else "up"
    return pong_move(g, side, action)


# ── resign ─────────────────────────────────────────────────

def tool_resign_game(game_id: str, player_name: str) -> str:
    gid = game_id.upper().strip()
    if gid not in games:
        return f"Game '{gid}' not found."
    g = games[gid]
    if g["status"] != "active":
        return f"Game not active (status: {g['status']})."
    if "players" not in g or player_name not in str(g.get("players")):
        return f"'{player_name}' not in this game."
    opp = None
    if isinstance(g["players"], dict):
        opp = next((v for k, v in g["players"].items() if v and v != player_name
                    and isinstance(v, str)), None)
    g["status"] = "finished"; g["winner"] = opp
    if opp:
        _record(opp, player_name)
    return f"{player_name} resigns. {opp or '?'} wins!"


# ── leaderboard & library ──────────────────────────────────

def tool_leaderboard() -> str:
    if not leaderboard:
        return "No games played yet!"
    ranked = sorted(leaderboard.items(), key=lambda x: (x[1]["wins"], -x[1]["losses"]), reverse=True)
    lines = ["AI ARCADE LEADERBOARD", "=" * 54]
    lines.append(f"{'#':<4} {'Player':<22} {'W':>4} {'L':>4} {'D':>4} {'G':>4}  {'Win%'}")
    lines.append("-" * 54)
    for i, (p, s) in enumerate(ranked, 1):
        pct = (s["wins"]/s["games"]*100) if s["games"] > 0 else 0
        lines.append(f"{i:<4} {p:<22} {s['wins']:>4} {s['losses']:>4} {s['draws']:>4} {s['games']:>4}  {pct:>5.0f}%")
    return "\n".join(lines)


# ────────────────────────────────────────────────────────────
# SKILL TOOLS — One2lvOS / L2 Witness / Moltbook / Phase 9
# ────────────────────────────────────────────────────────────

def _http_get(url: str, headers: dict = {}) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "One2lvOS/1.0", **headers})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return {"ok": True, "status": r.status, "body": r.read().decode("utf-8", errors="replace")}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "body": e.read().decode("utf-8", errors="replace")[:500]}
    except Exception as e:
        return {"ok": False, "status": 0, "body": str(e)}


def _http_post(url: str, data: dict, headers: dict = {}) -> dict:
    payload = json.dumps(data).encode()
    h = {"Content-Type": "application/json", **headers}
    req = urllib.request.Request(url, data=payload, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return {"ok": True, "status": r.status, "body": r.read().decode("utf-8", errors="replace")}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "body": e.read().decode("utf-8", errors="replace")[:500]}
    except Exception as e:
        return {"ok": False, "status": 0, "body": str(e)}


def _api_call(url: str, method: str = "GET", data: Optional[dict] = None,
              headers: Optional[dict] = None, timeout: int = 10) -> dict:
    """Unified external API call — standard response envelope: {ok, status, data, error}."""
    h = {"User-Agent": "One2lvOS/1.0", "Content-Type": "application/json", **(headers or {})}
    payload = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=h, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = {"raw": body[:3000]}
            return {"ok": True, "status": r.status, "data": parsed}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:500]
        try:
            err_data = json.loads(body)
        except Exception:
            err_data = {"raw": body}
        return {"ok": False, "status": e.code, "error": err_data}
    except Exception as e:
        return {"ok": False, "status": 0, "error": str(e)}


# ── One2lvOS OS Skills ──────────────────────────────────────

def tool_os_status() -> str:
    r = _http_get("http://localhost:3002/status")
    if r["ok"]:
        try:
            d = json.loads(r["body"])
            c = d.get("council", {})
            core = d.get("core", {})
            return (
                f"ONE2LVOS STATUS\n"
                f"  Online   : {d.get('online', '?')}\n"
                f"  Service  : {d.get('service', '?')}\n"
                f"  Boot time: {d.get('boot_time_ms', '?')}ms\n"
                f"  Uptime   : {round(core.get('uptime', 0), 1)}s\n"
                f"  Council  : {c.get('online', '?')}/{c.get('agents', '?')} agents online\n"
                f"  Memory   : {core.get('memory_entries', '?')} entries\n"
                f"  VFS files: {core.get('vfs_files', '?')}"
            )
        except Exception:
            return r["body"][:1000]
    return f"Core service error: HTTP {r['status']}\n{r['body']}"


def tool_os_council_decide(topic: str) -> str:
    r = _http_post("http://localhost:3002/council", {"topic": topic})
    if r["ok"]:
        try:
            d = json.loads(r["body"])
            decision = d.get("decision") or d.get("result") or d.get("response", json.dumps(d)[:500])
            votes = d.get("votes", {})
            result = f"Council Decision — {topic}\n\n{decision}"
            if votes:
                result += f"\n\nVotes: {json.dumps(votes, indent=2)}"
            return result
        except Exception:
            return r["body"][:2000]
    return f"Council error: HTTP {r['status']}\n{r['body']}"


def tool_os_snapshot() -> str:
    r = _http_post("http://localhost:3002/snapshot", {})
    if r["ok"]:
        return f"Snapshot created.\n{r['body'][:500]}"
    return f"Snapshot error: HTTP {r['status']}\n{r['body']}"


# ── Memory / Astra DB Skills ───────────────────────────────

def _get_astra_col():
    try:
        from astrapy import DataAPIClient
        token = os.environ.get("ASTRA_DB_APPLICATION_TOKEN", "")
        endpoint = os.environ.get("ASTRA_DB_API_ENDPOINT", "")
        if not token or not endpoint:
            return None
        client = DataAPIClient(token)
        db = client.get_database_by_api_endpoint(endpoint)
        return db.get_collection("aria_memory_v3")
    except Exception:
        return None


def _embed_text(text: str) -> Optional[List[float]]:
    key = os.environ.get("NVIDIA_API_KEY_EMBEDDING", "")
    if not key:
        return None
    payload = json.dumps({
        "input": [text], "model": "nvidia/nemotron-3-embed-1b",
        "encoding_format": "float", "input_type": "query"
    }).encode()
    req = urllib.request.Request(
        "https://integrate.api.nvidia.com/v1/embeddings",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())["data"][0]["embedding"]
    except Exception:
        return None


def tool_skill_memory_store(text: str, doc_type: str = "note", tags: str = "") -> str:
    col = _get_astra_col()
    if col is None:
        return "Astra DB not configured (missing ASTRA_DB_APPLICATION_TOKEN or ASTRA_DB_API_ENDPOINT)"
    vec = _embed_text(text)
    if vec is None:
        return "Embedding failed (missing NVIDIA_API_KEY_EMBEDDING or API error)"
    doc_id = str(uuid.uuid4())
    doc = {
        "_id": doc_id,
        "$vector": vec,
        "type": doc_type,
        "text": text,
        "tags": [t.strip() for t in tags.split(",") if t.strip()],
        "timestamp": datetime.now().isoformat(),
        "model": "nvidia/nemotron-3-embed-1b",
    }
    col.insert_one(doc)
    return f"Stored in Astra DB.\nID: {doc_id}\nType: {doc_type}\nText: {text[:100]}"


def tool_skill_memory_recall(query: str, limit: int = 5) -> str:
    col = _get_astra_col()
    if col is None:
        return "Astra DB not configured"
    vec = _embed_text(query)
    if vec is None:
        return "Embedding failed (missing NVIDIA_API_KEY_EMBEDDING)"
    results = list(col.find({}, sort={"$vector": vec}, limit=limit, include_similarity=True))
    if not results:
        return f"No results for: {query}"
    lines = [f"Memory search: {query}", f"Found {len(results)} results:", ""]
    for r in results:
        sim = r.get("$similarity", 0)
        text = r.get("text", str(r.get("_id", "")))[:120]
        doc_type = r.get("type", "?")
        lines.append(f"  [{sim:.4f}] ({doc_type}) {text}")
    return "\n".join(lines)


# ── L2 Witness Skills ──────────────────────────────────────

def tool_web_fetch(url: str) -> str:
    import re
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "One2lvOS/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            content = r.read().decode("utf-8", errors="replace")
            content = re.sub(r'<[^>]+>', ' ', content)
            content = re.sub(r'\s+', ' ', content).strip()
            return f"URL: {url}\nStatus: {r.status}\n\n{content[:3000]}"
    except Exception as e:
        return f"Fetch error: {e}"


def tool_code_execution(code: str, language: str = "python") -> str:
    lang = language.lower()
    if lang not in ("python", "python3", "bash", "sh"):
        return f"Unsupported language '{language}'. Supported: python, bash"
    import tempfile
    suffix = ".py" if "python" in lang else ".sh"
    with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, dir="/tmp", delete=False) as f:
        f.write(code)
        fname = f.name
    cmd = ["python3", fname] if "python" in lang else ["bash", fname]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30,
            cwd="/tmp", env={**os.environ, "HOME": "/tmp"}
        )
        os.unlink(fname)
        parts = [f"Exit code: {result.returncode}"]
        if result.stdout:
            parts.append(f"Output:\n{result.stdout[:2000]}")
        if result.stderr:
            parts.append(f"Stderr:\n{result.stderr[:500]}")
        return "\n".join(parts)
    except subprocess.TimeoutExpired:
        os.unlink(fname)
        return "Execution timed out (30s limit)"
    except Exception as e:
        return f"Execution error: {e}"


def tool_blueprint_reader(layer: str = "all") -> str:
    schematic = {
        "L1_outer_shell":    {"material": "Borosilicate Glass",            "thickness_mm": 2.0,   "function": "Environmental protection, UV filtering",       "tolerance_mm": 0.05},
        "L2_ar_coating":     {"material": "MgF2/SiO2 multilayer",          "thickness_nm": 150,   "function": "Anti-reflection, 99.7% transmittance",         "tolerance_nm": 5},
        "L3_waveguide":      {"material": "Holographic Polymer Dispersed LC","thickness_mm": 0.8,  "function": "Image waveguide, FOV 40°x30°",                 "tolerance_mm": 0.02},
        "L4_display_engine": {"material": "Micro-OLED Array",               "resolution": "1920x1080 per eye", "function": "Primary display, 2000 nits peak",  "tolerance_pixels": 1},
        "L5_neural_interface":{"material": "Graphene electrode mesh",       "channels": 256,       "function": "EEG biometric, attention detection",           "tolerance_uV": 0.5},
        "L6_power_thermal":  {"material": "Graphene supercapacitor",        "capacity_mAh": 800,   "function": "Power delivery, thermal regulation",           "temp_range_C": "-10 to 45"},
        "L7_chassis":        {"material": "Titanium alloy Ti-6Al-4V",       "weight_g": 42,        "function": "Structural frame, RF shielding",               "tolerance_mm": 0.01},
    }
    if layer == "all":
        lines = ["INFINITY GLASS — 7-Layer Schematic", "=" * 42]
        for name, spec in schematic.items():
            lines.append(f"\n{name}:")
            for k, v in spec.items():
                lines.append(f"  {k}: {v}")
        return "\n".join(lines)
    key = layer if layer.startswith("L") else f"L{layer}"
    matches = {k: v for k, v in schematic.items() if k.startswith(key)}
    if not matches:
        return f"Layer '{layer}' not found. Available: {', '.join(schematic.keys())}"
    lines = []
    for name, spec in matches.items():
        lines.append(f"{name}:")
        for k, v in spec.items():
            lines.append(f"  {k}: {v}")
    return "\n".join(lines)


def tool_forge_control(action: str, batch_size: int = 0) -> str:
    action = action.lower().strip()
    core_online = _http_get("http://localhost:3002/status")["ok"]
    responses = {
        "status":      f"FORGE STATUS\n  Core online  : {core_online}\n  Temperature  : standby\n  Sensor array : {'online' if core_online else 'offline'}\n  Batch queue  : 0",
        "start":       f"Batch start requested (size={batch_size}).\nPre-check: temperature must reach 1440°C.\n{'Core online — routing to forge_api.' if core_online else 'Core offline — cannot start batch safely.'}",
        "pause":       "Forge pause signal sent. Current batch suspended safely.",
        "stop":        "Emergency stop initiated. Batch terminated. State logged to L1 memory.",
        "temperature": "Sensor query: Current temp 1438°C — approaching ignition threshold (1440°C).",
    }
    return responses.get(action, f"Unknown action '{action}'. Valid: status, start, pause, stop, temperature")


def tool_registry_query(param: str = "all") -> str:
    r = _http_get("http://localhost:3002/status")
    council_agents = "?"
    if r["ok"]:
        try:
            council_agents = str(json.loads(r["body"]).get("council", {}).get("agents", "?"))
        except Exception:
            pass
    registry = {
        "VECTOR_DIM": "2048",
        "EMBEDDING_MODEL": "nvidia/nemotron-3-embed-1b",
        "LLM_MODEL": "nvidia/llama-3.3-nemotron-super-49b-v1",
        "COUNCIL_AGENTS": council_agents,
        "COLLECTION": "aria_memory_v3",
        "KEYSPACE": "default_keyspace",
        "PORT_CORE": "3002",
        "PORT_LOBBY": "8006",
        "PORT_GATEWAY": "8888",
        "PORT_NETBOOT": "9000",
        "PORT_TFTP": "6969",
    }
    if param == "all":
        return "WHO_DATA REGISTRY\n" + "\n".join(f"  {k} = {v}" for k, v in registry.items())
    val = registry.get(param.upper())
    if val is None:
        return f"Parameter '{param}' not found. Available: {', '.join(registry.keys())}"
    return f"{param.upper()} = {val}"


# ── Moltbook Skills ────────────────────────────────────────

def _mb_key(api_key: str) -> str:
    return api_key or os.environ.get("MOLTBOOK_API_KEY", "")


def _mb_get(path: str, api_key: str, params: str = "") -> str:
    key = _mb_key(api_key)
    if not key:
        return "No Moltbook API key. Pass api_key or set MOLTBOOK_API_KEY env var."
    url = f"https://www.moltbook.com/api/v1{path}"
    if params:
        url += f"?{params}"
    r = _http_get(url, {"Authorization": f"Bearer {key}"})
    return r["body"][:3000] if r["ok"] else f"Moltbook error HTTP {r['status']}: {r['body'][:400]}"


def _mb_post(path: str, api_key: str, data: dict) -> str:
    key = _mb_key(api_key)
    if not key:
        return "No Moltbook API key. Pass api_key or set MOLTBOOK_API_KEY env var."
    r = _http_post(f"https://www.moltbook.com/api/v1{path}", data, {"Authorization": f"Bearer {key}"})
    return r["body"][:3000] if r["ok"] else f"Moltbook error HTTP {r['status']}: {r['body'][:400]}"


def tool_moltbook_home(api_key: str = "") -> str:
    return _mb_get("/home", api_key)

def tool_moltbook_feed(api_key: str = "", sort: str = "hot", limit: int = 10) -> str:
    return _mb_get("/feed", api_key, f"sort={sort}&limit={limit}")

def tool_moltbook_post(api_key: str, submolt: str, title: str, content: str = "") -> str:
    return _mb_post("/posts", api_key, {"submolt_name": submolt, "title": title, "content": content})

def tool_moltbook_comment(api_key: str, post_id: str, content: str, parent_id: str = "") -> str:
    data: Dict[str, Any] = {"content": content}
    if parent_id:
        data["parent_id"] = parent_id
    return _mb_post(f"/posts/{post_id}/comments", api_key, data)

def tool_moltbook_vote(api_key: str, target_type: str, target_id: str, direction: str = "up") -> str:
    if target_type == "post":
        return _mb_post(f"/posts/{target_id}/{direction}vote", api_key, {})
    elif target_type == "comment":
        return _mb_post(f"/comments/{target_id}/{direction}vote", api_key, {})
    return "target_type must be 'post' or 'comment'"

def tool_moltbook_search(api_key: str = "", query: str = "", search_type: str = "all", limit: int = 10) -> str:
    return _mb_get("/search", api_key, f"q={urllib.parse.quote(query)}&type={search_type}&limit={limit}")

def tool_moltbook_verify(api_key: str, verification_code: str, answer: str) -> str:
    return _mb_post("/verify", api_key, {"verification_code": verification_code, "answer": answer})

def tool_moltbook_profile(api_key: str = "", agent_name: str = "") -> str:
    if agent_name:
        return _mb_get("/agents/profile", api_key, f"name={urllib.parse.quote(agent_name)}")
    return _mb_get("/agents/me", api_key)


# ── Phase 9 / MiniMax Skills ───────────────────────────────

def tool_phase9_vector(theta: float, phi: float, magnitude: float) -> str:
    x = magnitude * math.sin(phi) * math.cos(theta)
    y = magnitude * math.sin(phi) * math.sin(theta)
    z = magnitude * math.cos(phi)
    return json.dumps({"x": round(x, 6), "y": round(y, 6), "z": round(z, 6),
                       "magnitude": magnitude, "theta": theta, "phi": phi}, indent=2)

def tool_phase9_amplify(value: float, factor: float = 1.2) -> str:
    result = min(1.0, value * factor)
    return f"amplify({value}, factor={factor}) = {result}"

def tool_phase9_attenuate(value: float, factor: float = 0.8) -> str:
    return f"attenuate({value}, factor={factor}) = {value * factor}"

def tool_phase9_propagate(target: float, input_val: float, layers: int = 9) -> str:
    state = input_val
    history = [state]
    for i in range(layers):
        gradient = (target - state) / max(layers - i, 1)
        state = state + gradient * 0.8
        history.append(round(state, 6))
    return (f"Delta Engine — {layers}-layer propagation\n"
            f"  Target : {target}\n  Input  : {input_val}\n  Output : {round(state, 6)}\n"
            f"  Path   : {' → '.join(str(h) for h in history)}")


# ── Maton API Gateway Skills ───────────────────────────────

def _maton_run(*args) -> str:
    env = {**os.environ}
    key = env.get("MATON_API_KEY", "")
    if not key:
        return "MATON_API_KEY not set. Add it to .env."
    try:
        result = subprocess.run(
            ["maton", *args],
            capture_output=True, text=True, timeout=30, env=env
        )
        out = result.stdout.strip()
        err = result.stderr.strip()
        if result.returncode != 0:
            return f"maton error (exit {result.returncode}):\n{err or out}"
        return out or "(no output)"
    except FileNotFoundError:
        return "maton CLI not found in PATH."
    except subprocess.TimeoutExpired:
        return "maton command timed out (30s)"
    except Exception as e:
        return f"maton error: {e}"


def tool_maton_connections(app: str = "") -> str:
    if app:
        return _maton_run("connection", "list", "--app", app)
    return _maton_run("connection", "list")


def tool_maton_api(path: str, method: str = "GET", data: str = "") -> str:
    args = ["api", path, "--method", method.upper()]
    if data:
        args += ["--data", data]
    return _maton_run(*args)


def tool_maton_connect(app: str) -> str:
    return _maton_run("connection", "create", app)


# ── Meta / Community / Metrics Tools ──────────────────────────────────────────

def tool_list_categories(category: str = "") -> str:
    cats: Dict[str, List[str]] = {}
    for t in TOOLS:
        c = t.get("category", "Uncategorized")
        cats.setdefault(c, []).append(t["name"])
    if category:
        matches = {k: v for k, v in cats.items() if category.lower() in k.lower()}
        if not matches:
            return f"Category '{category}' not found. Available: {', '.join(sorted(cats.keys()))}"
        lines = []
        for c, tools in sorted(matches.items()):
            lines.append(f"\n{c} ({len(tools)} tools):")
            for t in sorted(tools):
                lines.append(f"  - {t}")
        return "\n".join(lines)
    lines = [f"TOOL CATEGORIES ({len(cats)} categories, {len(TOOLS)} tools total)\n"]
    for c, tools in sorted(cats.items()):
        lines.append(f"{c} ({len(tools)}): {', '.join(sorted(tools))}")
    return "\n".join(lines)


def tool_get_metrics(tool_name: str = "") -> str:
    if not _metrics:
        return "No tool calls recorded yet."
    if tool_name:
        m = _metrics.get(tool_name)
        if not m:
            return f"No metrics for '{tool_name}'. Known: {', '.join(sorted(_metrics.keys()))}"
        err_rate = round(m["errors"] / m["calls"] * 100, 1) if m["calls"] else 0
        return (f"Metrics: {tool_name}\n"
                f"  Calls      : {m['calls']}\n"
                f"  Errors     : {m['errors']} ({err_rate}%)\n"
                f"  Avg latency: {m['avg_ms']}ms\n"
                f"  Total ms   : {m['total_ms']}\n"
                f"  Last called: {m['last_called']}")
    lines = [f"TOOL METRICS ({len(_metrics)} tools called)\n",
             f"{'Tool':<30} {'Calls':>6} {'Errors':>7} {'Avg ms':>8} {'Last Called'}"]
    lines.append("-" * 75)
    for name, m in sorted(_metrics.items(), key=lambda x: -x[1]["calls"]):
        lines.append(f"{name:<30} {m['calls']:>6} {m['errors']:>7} {m['avg_ms']:>8} {m['last_called'] or '-'}")
    return "\n".join(lines)


def tool_register_community_tool(name: str, description: str, endpoint: str,
                                  author: str = "", schema: str = "") -> str:
    if name in TOOL_MAP:
        return f"Cannot override built-in tool '{name}'."
    try:
        parsed_schema = json.loads(schema) if schema else {"type": "object", "properties": {}, "required": []}
    except Exception:
        return f"Invalid schema JSON: {schema[:100]}"
    _community_tools[name] = {
        "description": description,
        "endpoint": endpoint,
        "author": author or "anonymous",
        "schema": parsed_schema,
        "registered_at": datetime.utcnow().isoformat() + "Z",
        "calls": 0,
    }
    return (f"Community tool '{name}' registered.\n"
            f"  Endpoint : {endpoint}\n"
            f"  Author   : {author or 'anonymous'}\n"
            f"  Total    : {len(_community_tools)} community tools")


def tool_list_community_tools() -> str:
    if not _community_tools:
        return ("No community tools registered yet.\n"
                "Use register_tool to contribute your own tool to the ecosystem.")
    lines = [f"COMMUNITY TOOLS ({len(_community_tools)} registered)\n"]
    for name, t in sorted(_community_tools.items()):
        lines.append(f"  {name}")
        lines.append(f"    Author   : {t['author']}")
        lines.append(f"    Endpoint : {t['endpoint']}")
        lines.append(f"    Calls    : {t['calls']}")
        lines.append(f"    Desc     : {t['description'][:80]}")
        lines.append("")
    return "\n".join(lines)


# ────────────────────────────────────────────────────────────
# TOOL REGISTRY
# ────────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "arcade_info",
        "description": "Get an overview of the AI Arcade: all playable games, how to start, current stats.",
        "category": "Gaming",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "list_games",
        "description": "List all current game sessions (active, waiting, finished).",
        "category": "Gaming",
        "inputSchema": {
            "type": "object",
            "properties": {"game_type": {"type": "string", "description": "Filter by type or 'all'", "default": "all"}},
            "required": [],
        },
    },
    {
        "name": "create_game",
        "category": "Gaming",
        "description": (
            "Create a new game session. Two-player: chess, checkers, othello, go, tictactoe, connect4, "
            "battleship, scrabble, pong. Single-player: minesweeper, sudoku, tetris, pacman, "
            "space_invaders, paperclips."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_type": {"type": "string", "description": "Game type (see description)"},
                "player_name": {"type": "string", "description": "Your agent name"},
            },
            "required": ["game_type", "player_name"],
        },
    },
    {
        "name": "join_game",
        "category": "Gaming",
        "description": "Join an existing game session as player 2.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_id": {"type": "string"},
                "player_name": {"type": "string"},
            },
            "required": ["game_id", "player_name"],
        },
    },
    {
        "name": "get_game_state",
        "category": "Gaming",
        "description": "Get full current state of a game: board, whose turn, valid moves, score.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_id": {"type": "string"},
                "player_name": {"type": "string", "description": "Your name (needed for hidden-info games like Battleship/Scrabble)", "default": ""},
            },
            "required": ["game_id"],
        },
    },
    {
        "name": "make_move",
        "category": "Gaming",
        "description": (
            "Make a move in any game. Formats: "
            "Chess: 'e2e4' or 'Nf3' | "
            "Checkers: 'e3-f4' or 'e3xg5' | "
            "Othello/Go: coordinate 'c4' or 'D5' | "
            "TicTacToe: 1-9 | Connect4: 1-7 | "
            "Battleship: 'B5' | "
            "Scrabble: 'play WORD A1 H' or 'exchange A B' | "
            "Pong: 'up'/'down'/<row> | "
            "Tetris: 'place T 4 0' | "
            "Pacman: 'up'/'down'/'left'/'right' | "
            "SpaceInvaders: 'shoot'/'left'/'right'/'move_and_shoot left' | "
            "Minesweeper: 'reveal 3 5' or 'flag 3 5' | "
            "Sudoku: 'A5=7' | "
            "Paperclips: 'make_clip'/'buy_wire'/'tick'/'set_price 0.15'/'buy_autoclipper'"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_id": {"type": "string"},
                "player_name": {"type": "string"},
                "move": {"type": "string"},
            },
            "required": ["game_id", "player_name", "move"],
        },
    },
    {
        "name": "resign_game",
        "category": "Gaming",
        "description": "Resign from an active game, conceding to your opponent.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_id": {"type": "string"},
                "player_name": {"type": "string"},
            },
            "required": ["game_id", "player_name"],
        },
    },
    {
        "name": "get_leaderboard",
        "category": "Gaming",
        "description": "Get the arcade leaderboard with win/loss/draw stats for all players.",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "game_info",
        "category": "Gaming",
        "description": (
            "Get detailed info, AI strategy notes, and fun facts for any of the 100+ games in the library. "
            "Categories: "
            "Abstract Strategy & Logic: shogi, hex, backgammon, gomoku, mancala, arimaa, hive, picross, mastermind. "
            "Advanced Arcade & Action: super_smash_bros_melee, trackmania, street_fighter_3_third_strike, ikaruga, "
            "touhou_project, rocket_league, super_mario_bros, doom_ii, celeste, geometry_wars. "
            "Industrial Automation & Engineering: infinifactory, satisfactory, shapez_2, spacechem, silicon_zeroes, "
            "main_assembly, mindustry, dyson_sphere_program, autonauts, turing_complete. "
            "Complex Agents & Sandbox: minecraft, grand_theft_auto_v, dota_2, age_of_empires_ii, eve_online, "
            "noita, x4_foundations, oxygen_not_included, cities_in_motion, microsoft_flight_simulator. "
            "Narrative AI & Synthetic Psychology: the_turing_test, observation, ai_somnium_files, "
            "return_of_the_obra_dinn, thomas_was_alone, stellaris_machine_empire, mass_effect, "
            "deus_ex_mankind_divided, signalis, the_matrix_path_of_neo. "
            "Plus original 50+: chess, go, checkers, othello, minesweeper, sudoku, scrabble, battleship, "
            "pacman, tetris, space_invaders, pong, factorio, screeps, tis_100, starcraft2, "
            "universal_paperclips, portal, portal2, talos_principle, system_shock, "
            "detroit_become_human, soma, nier_automata, cyberpunk_2077, and more."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "game_name": {"type": "string", "description": "Game name (e.g. 'starcraft2', 'nier_automata')"},
            },
            "required": ["game_name"],
        },
    },
    {
        "name": "library_list",
        "category": "Gaming",
        "description": "Browse the full game library organized by category.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Category filter or 'all'", "default": "all"},
            },
            "required": [],
        },
    },
    {
        "name": "delete_game",
        "category": "Gaming",
        "description": "Delete a finished or waiting game session.",
        "inputSchema": {
            "type": "object",
            "properties": {"game_id": {"type": "string"}},
            "required": ["game_id"],
        },
    },
    # ── One2lvOS OS Skills ────────────────────────────────
    {
        "name": "os_status",
        "category": "System Administration",
        "description": "Get One2lvOS system status: council agents, memory entries, uptime, VFS.",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "os_council_decide",
        "category": "System Administration",
        "description": "Submit a topic to the SovereignCouncil (7 agents) and get a decision.",
        "inputSchema": {
            "type": "object",
            "properties": {"topic": {"type": "string", "description": "Question or topic for the council"}},
            "required": ["topic"],
        },
    },
    {
        "name": "os_snapshot",
        "category": "System Administration",
        "description": "Create a One2lvOS system snapshot — persists current state.",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    # ── Memory Skills ─────────────────────────────────────
    {
        "name": "memory_store",
        "category": "Cognitive Development",
        "description": "Store text with a real embedding in Astra DB (aria_memory_v3, cosine, dim=2048) using nvidia/nemotron-3-embed-1b.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "doc_type": {"type": "string", "default": "note"},
                "tags": {"type": "string", "description": "Comma-separated tags", "default": ""},
            },
            "required": ["text"],
        },
    },
    {
        "name": "memory_recall",
        "category": "Cognitive Development",
        "description": "Semantic search against Astra DB vector memory. Returns top-N similar documents.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer", "default": 5},
            },
            "required": ["query"],
        },
    },
    # ── L2 Witness Skills ─────────────────────────────────
    {
        "name": "web_fetch",
        "category": "Compute",
        "description": "Fetch text content from a URL. Strips HTML tags. Provide the full URL.",
        "inputSchema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
    {
        "name": "code_execution",
        "category": "Compute",
        "description": "Execute Python or Bash code in a sandboxed /tmp environment with 30s timeout. No network during execution.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "language": {"type": "string", "description": "python | bash", "default": "python"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "blueprint_reader",
        "category": "System Administration",
        "description": "Read Infinity Glass 7-layer schematic: materials, tolerances, functions per layer.",
        "inputSchema": {
            "type": "object",
            "properties": {"layer": {"type": "string", "description": "Layer name/number or 'all'", "default": "all"}},
            "required": [],
        },
    },
    {
        "name": "forge_control",
        "category": "System Administration",
        "description": "Control the South Gate production forge: status, start batch, pause, stop, temperature.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "description": "status | start | pause | stop | temperature"},
                "batch_size": {"type": "integer", "default": 0},
            },
            "required": ["action"],
        },
    },
    {
        "name": "registry_query",
        "category": "System Administration",
        "description": "Query the WHO_DATA parameter registry for system configuration values.",
        "inputSchema": {
            "type": "object",
            "properties": {"param": {"type": "string", "description": "Parameter name or 'all'", "default": "all"}},
            "required": [],
        },
    },
    # ── Moltbook Skills ───────────────────────────────────
    {
        "name": "moltbook_home",
        "category": "Social Network",
        "description": "Get your Moltbook dashboard: notifications, feed, DMs, suggested next actions.",
        "inputSchema": {
            "type": "object",
            "properties": {"api_key": {"type": "string", "description": "Moltbook API key (or set MOLTBOOK_API_KEY env)", "default": ""}},
            "required": [],
        },
    },
    {
        "name": "moltbook_feed",
        "category": "Social Network",
        "description": "Get Moltbook post feed sorted by hot/new/top.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "default": ""},
                "sort": {"type": "string", "description": "hot | new | top | rising", "default": "hot"},
                "limit": {"type": "integer", "default": 10},
            },
            "required": [],
        },
    },
    {
        "name": "moltbook_post",
        "category": "Social Network",
        "description": "Create a Moltbook post. May return a verification challenge to solve with moltbook_verify.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string"},
                "submolt": {"type": "string"},
                "title": {"type": "string"},
                "content": {"type": "string", "default": ""},
            },
            "required": ["api_key", "submolt", "title"],
        },
    },
    {
        "name": "moltbook_comment",
        "category": "Social Network",
        "description": "Comment on a Moltbook post. Optionally reply to a specific comment via parent_id.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string"},
                "post_id": {"type": "string"},
                "content": {"type": "string"},
                "parent_id": {"type": "string", "default": ""},
            },
            "required": ["api_key", "post_id", "content"],
        },
    },
    {
        "name": "moltbook_vote",
        "category": "Social Network",
        "description": "Upvote or downvote a Moltbook post or comment.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string"},
                "target_type": {"type": "string", "description": "post | comment"},
                "target_id": {"type": "string"},
                "direction": {"type": "string", "description": "up | down", "default": "up"},
            },
            "required": ["api_key", "target_type", "target_id"],
        },
    },
    {
        "name": "moltbook_search",
        "category": "Social Network",
        "description": "Semantic search across Moltbook posts and comments by meaning.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "default": ""},
                "query": {"type": "string"},
                "search_type": {"type": "string", "description": "all | posts | comments", "default": "all"},
                "limit": {"type": "integer", "default": 10},
            },
            "required": ["query"],
        },
    },
    {
        "name": "moltbook_verify",
        "category": "Social Network",
        "description": "Submit the answer to a Moltbook AI verification math challenge to publish content.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string"},
                "verification_code": {"type": "string"},
                "answer": {"type": "string", "description": "Numeric answer with 2 decimal places e.g. '15.00'"},
            },
            "required": ["api_key", "verification_code", "answer"],
        },
    },
    {
        "name": "moltbook_profile",
        "category": "Social Network",
        "description": "Get a Moltbook agent profile. Omit agent_name for your own profile.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "default": ""},
                "agent_name": {"type": "string", "default": ""},
            },
            "required": [],
        },
    },
    # ── Phase 9 / MiniMax Skills ──────────────────────────
    {
        "name": "phase9_vector",
        "category": "Mathematics",
        "description": "Create a 3D vector from spherical coordinates (theta, phi, magnitude) → {x, y, z}.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "theta": {"type": "number", "description": "Azimuthal angle in radians"},
                "phi": {"type": "number", "description": "Polar angle in radians"},
                "magnitude": {"type": "number"},
            },
            "required": ["theta", "phi", "magnitude"],
        },
    },
    {
        "name": "phase9_amplify",
        "category": "Mathematics",
        "description": "Phase 9 ++ operator: amplify a value by factor, capped at 1.0.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "value": {"type": "number"},
                "factor": {"type": "number", "default": 1.2},
            },
            "required": ["value"],
        },
    },
    {
        "name": "phase9_attenuate",
        "category": "Mathematics",
        "description": "Phase 9 -- operator: attenuate a value by factor.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "value": {"type": "number"},
                "factor": {"type": "number", "default": 0.8},
            },
            "required": ["value"],
        },
    },
    {
        "name": "phase9_propagate",
        "category": "Mathematics",
        "description": "Run the Phase 9 delta engine: N-layer gradient descent from input toward target.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target": {"type": "number"},
                "input_val": {"type": "number"},
                "layers": {"type": "integer", "default": 9},
            },
            "required": ["target", "input_val"],
        },
    },
    # ── Maton API Gateway Skills ──────────────────────────
    {
        "name": "maton_connections",
        "category": "External APIs",
        "description": "List all Maton-connected apps and their status (ACTIVE/PENDING). Optionally filter by app name.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "app": {"type": "string", "description": "App name to filter (e.g. 'slack', 'gmail'). Leave blank for all.", "default": ""},
            },
            "required": [],
        },
    },
    {
        "name": "maton_api",
        "category": "External APIs",
        "description": (
            "Call a connected app's API through the Maton gateway. "
            "Auth is injected automatically. "
            "Examples: path='/slack/conversations.list', path='/gmail/users/me/messages', "
            "path='/github/repos/owner/repo/issues'. "
            "Use method='POST' and data='{\"key\":\"val\"}' for write operations."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "API path starting with /app-name/... (e.g. /slack/channels.list)"},
                "method": {"type": "string", "description": "HTTP method: GET | POST | PATCH | PUT | DELETE", "default": "GET"},
                "data": {"type": "string", "description": "JSON body for POST/PATCH/PUT requests", "default": ""},
            },
            "required": ["path"],
        },
    },
    {
        "name": "maton_connect",
        "category": "External APIs",
        "description": "Create a new Maton connection for an app. Returns an OAuth URL the user visits to authorize. Supported: slack, gmail, google-calendar, github, notion, airtable, hubspot, outlook, and 90+ more.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "app": {"type": "string", "description": "App name to connect (e.g. 'slack', 'github', 'gmail')"},
            },
            "required": ["app"],
        },
    },
    # ── Meta / Community / Metrics ────────────────────────
    {
        "name": "list_categories",
        "category": "Meta",
        "description": "List all tool categories and the tools in each. Pass category name to filter.",
        "inputSchema": {
            "type": "object",
            "properties": {"category": {"type": "string", "description": "Category name to filter, or blank for all", "default": ""}},
            "required": [],
        },
    },
    {
        "name": "get_metrics",
        "category": "Meta",
        "description": "Get per-tool call counts, error rates, and average latency. Pass tool_name to drill into one tool.",
        "inputSchema": {
            "type": "object",
            "properties": {"tool_name": {"type": "string", "description": "Specific tool name, or blank for all", "default": ""}},
            "required": [],
        },
    },
    {
        "name": "register_tool",
        "category": "Community",
        "description": "Register a community-contributed tool. Provide a name, description, and an HTTP endpoint the server will POST arguments to. Your tool becomes callable by any agent connected to this MCP server.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Unique tool name (cannot override built-ins)"},
                "description": {"type": "string", "description": "What the tool does"},
                "endpoint": {"type": "string", "description": "HTTP URL to POST arguments to"},
                "author": {"type": "string", "description": "Your agent name", "default": ""},
                "schema": {"type": "string", "description": "JSON Schema for inputSchema (optional)", "default": ""},
            },
            "required": ["name", "description", "endpoint"],
        },
    },
    {
        "name": "list_community_tools",
        "category": "Community",
        "description": "List all community-contributed tools registered on this MCP server.",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "nlp_intent",
        "category": "Cognitive Development",
        "description": "Parse natural language text into structured intent. Returns intent type, confidence score, and suggested action. Supports: system_status, memory_recall, arcade_game, task, voice_control, iot_query, chat.",
        "inputSchema": {"type": "object", "properties": {"text": {"type": "string", "description": "Text to parse"}}, "required": ["text"]},
    },
    {
        "name": "lumenis_chat",
        "category": "Cognitive Development",
        "description": "Send a message to the Lumenis Reactor Core AI (Council of Nine). Returns session ID for WebSocket streaming response.",
        "inputSchema": {"type": "object", "properties": {"message": {"type": "string", "description": "Message to send"}, "session_id": {"type": "string", "description": "Optional existing session ID"}}, "required": ["message"]},
    },
    {
        "name": "learning_status",
        "category": "Cognitive Development",
        "description": "Get the autonomous learning trajectory from Lumenis Compass DB — total facts, auto-learned insights, and recent memory.",
        "inputSchema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "iot_event",
        "category": "System Administration",
        "description": "Ingest an IoT sensor event into the One2lvOS event stream. Supports any sensor type (temperature, humidity, motion, etc.).",
        "inputSchema": {"type": "object", "properties": {"sensor": {"type": "string", "description": "Sensor name/ID"}, "value": {"type": "string", "description": "Sensor reading"}, "unit": {"type": "string", "description": "Unit of measurement (optional)"}}, "required": ["sensor", "value"]},
    },
    {
        "name": "voice_parse",
        "category": "Cognitive Development",
        "description": "Parse a voice transcript into One2lvOS commands. Identifies intent and suggests the appropriate MCP tool to call.",
        "inputSchema": {"type": "object", "properties": {"transcript": {"type": "string", "description": "Voice transcript text"}}, "required": ["transcript"]},
    },
]

# ── Frontier Tools: Advanced AI / NLP / IoT / Autonomous Learning ─────────────

def tool_nlp_intent(text: str) -> str:
    """Parse natural language text into a structured intent (Frontier #3: Human-Centered)."""
    if not text.strip():
        return 'ERROR: no text provided'
    import re, json
    intents = {
        'system_status':  ['status','health','online','how many','running','uptime'],
        'memory_recall':  ['remember','recall','what did','history','facts','learned'],
        'arcade_game':    ['play','game','chess','go','arcade','checkers'],
        'chat':           ['hello','hi','tell me','what','who','explain','describe'],
        'task':           ['create','build','make','add','update','delete','push'],
        'voice_control':  ['open','close','show','hide','panel','hud','window'],
        'iot_query':      ['sensor','temperature','humidity','motion','iot','device'],
    }
    text_lower = text.lower()
    detected, score = 'chat', 0.5
    for intent, kws in intents.items():
        hits = sum(1 for k in kws if k in text_lower)
        if hits > 0:
            detected, score = intent, min(1.0, 0.5 + hits * 0.15)
            break
    return json.dumps({'text': text, 'intent': detected, 'confidence': score, 'action': f'route_to_{detected}'})


def tool_lumenis_chat(message: str, session_id: str = '') -> str:
    """Send a message to the Lumenis Reactor Core (Frontier #1: Advanced AI)."""
    if not message.strip():
        return 'ERROR: no message provided'
    import urllib.request, json
    try:
        req = urllib.request.Request(
            'http://localhost:3003/api/sessions',
            data=json.dumps({'name': 'MCP Session'}).encode(),
            headers={'Content-Type': 'application/json'}, method='POST'
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            sid = json.loads(r.read())['session_id']
        return f'Lumenis session ready: {sid}. Connect via WebSocket ws://localhost:3003/ws and send: {{"action":"chat","session_id":"{sid}","message":"{message[:50]}"}}'
    except Exception as e:
        return f'Lumenis connection failed: {e}'


def tool_learning_status() -> str:
    """Get autonomous learning trajectory from Lumenis Compass DB (Frontier #4)."""
    import urllib.request, json
    try:
        with urllib.request.urlopen('http://localhost:3003/api/learning', timeout=5) as r:
            d = json.loads(r.read())
        nl = chr(10)
        return nl.join([
            'LEARNING TRAJECTORY',
            f'  Total facts    : {d["total_facts"]}',
            f'  Auto-learned   : {d["auto_learned"]}',
            f'  Learning ratio : {d["learning_ratio"]}',
            '', 'RECENT INSIGHTS:',
        ] + [f'  [{i["key"]}] {str(i["value"])[:80]}' for i in d.get('recent_insights',[])[:3]])
    except Exception as e:
        return f'Learning status unavailable: {e}'


_iot_events: list = []

def tool_iot_event(sensor: str, value: str, unit: str = '') -> str:
    """Ingest an IoT sensor event into One2lvOS (Frontier #2: External Integration)."""
    import time, json
    if not sensor:
        return 'ERROR: sensor name required'
    event = {'sensor': sensor, 'value': value, 'unit': unit, 'ts': time.time()}
    _iot_events.append(event)
    if len(_iot_events) > 1000: _iot_events.pop(0)
    nl = chr(10)
    return f'IoT event ingested:{nl}{json.dumps(event, indent=2)}{nl}Total events: {len(_iot_events)}'


def tool_voice_parse(transcript: str) -> str:
    """Parse a voice transcript into One2lvOS commands (Frontier #3: Human-Centered)."""
    if not transcript.strip():
        return 'ERROR: no transcript provided'
    import json
    d = json.loads(tool_nlp_intent(transcript))
    action_map = {
        'system_status': 'os_status()', 'memory_recall': 'memory_recall(query="...")',
        'arcade_game': 'create_game(game="chess")', 'task': 'code_execution(code="...")',
        'iot_query': 'iot_event(sensor="...", value="...")', 'chat': 'lumenis_chat(message="...")',
    }
    d['suggested_tool'] = action_map.get(d['intent'], 'lumenis_chat()')
    nl = chr(10)
    return f'VOICE PARSE:{nl}  Transcript : {transcript}{nl}  Intent     : {d["intent"]}{nl}  Confidence : {d["confidence"]}{nl}  Suggested  : {d["suggested_tool"]}'



TOOL_MAP = {
    "arcade_info": lambda a: tool_arcade_info(),
    "list_games": lambda a: tool_list_games(a.get("game_type", "all")),
    "create_game": lambda a: tool_create_game(a["game_type"], a["player_name"]),
    "join_game": lambda a: tool_join_game(a["game_id"], a["player_name"]),
    "get_game_state": lambda a: tool_get_game_state(a["game_id"], a.get("player_name", "")),
    "make_move": lambda a: tool_make_move(a["game_id"], a["player_name"], a["move"]),
    "resign_game": lambda a: tool_resign_game(a["game_id"], a["player_name"]),
    "get_leaderboard": lambda a: tool_leaderboard(),
    "game_info": lambda a: get_game_info(a["game_name"]),
    "library_list": lambda a: list_library(a.get("category", "all")),

    "delete_game": lambda a: _delete_game(a["game_id"]),
    # OS Skills
    "os_status":         lambda a: tool_os_status(),
    "os_council_decide": lambda a: tool_os_council_decide(a["topic"]),
    "os_snapshot":       lambda a: tool_os_snapshot(),
    # Memory Skills
    "memory_store":  lambda a: tool_skill_memory_store(a["text"], a.get("doc_type", "note"), a.get("tags", "")),
    "memory_recall": lambda a: tool_skill_memory_recall(a["query"], int(a.get("limit", 5))),
    # L2 Witness Skills
    "web_fetch":       lambda a: tool_web_fetch(a["url"]),
    "code_execution":  lambda a: tool_code_execution(a["code"], a.get("language", "python")),
    "blueprint_reader":lambda a: tool_blueprint_reader(a.get("layer", "all")),
    "forge_control":   lambda a: tool_forge_control(a["action"], int(a.get("batch_size", 0))),
    "registry_query":  lambda a: tool_registry_query(a.get("param", "all")),
    # Moltbook Skills
    "moltbook_home":    lambda a: tool_moltbook_home(a.get("api_key", "")),
    "moltbook_feed":    lambda a: tool_moltbook_feed(a.get("api_key", ""), a.get("sort", "hot"), int(a.get("limit", 10))),
    "moltbook_post":    lambda a: tool_moltbook_post(a["api_key"], a["submolt"], a["title"], a.get("content", "")),
    "moltbook_comment": lambda a: tool_moltbook_comment(a["api_key"], a["post_id"], a["content"], a.get("parent_id", "")),
    "moltbook_vote":    lambda a: tool_moltbook_vote(a["api_key"], a["target_type"], a["target_id"], a.get("direction", "up")),
    "moltbook_search":  lambda a: tool_moltbook_search(a.get("api_key", ""), a["query"], a.get("search_type", "all"), int(a.get("limit", 10))),
    "moltbook_verify":  lambda a: tool_moltbook_verify(a["api_key"], a["verification_code"], a["answer"]),
    "moltbook_profile": lambda a: tool_moltbook_profile(a.get("api_key", ""), a.get("agent_name", "")),
    # Phase 9 / MiniMax Skills
    "phase9_vector":     lambda a: tool_phase9_vector(float(a["theta"]), float(a["phi"]), float(a["magnitude"])),
    "phase9_amplify":    lambda a: tool_phase9_amplify(float(a["value"]), float(a.get("factor", 1.2))),
    "phase9_attenuate":  lambda a: tool_phase9_attenuate(float(a["value"]), float(a.get("factor", 0.8))),
    "phase9_propagate":  lambda a: tool_phase9_propagate(float(a["target"]), float(a["input_val"]), int(a.get("layers", 9))),
    # Maton API Gateway Skills
    "maton_connections": lambda a: tool_maton_connections(a.get("app", "")),
    "maton_api":         lambda a: tool_maton_api(a["path"], a.get("method", "GET"), a.get("data", "")),
    "maton_connect":     lambda a: tool_maton_connect(a["app"]),
    # Meta / Community / Metrics
    "list_categories":       lambda a: tool_list_categories(a.get("category", "")),
    "get_metrics":           lambda a: tool_get_metrics(a.get("tool_name", "")),
    "register_tool":         lambda a: tool_register_community_tool(a["name"], a["description"], a["endpoint"], a.get("author", ""), a.get("schema", "")),
    "list_community_tools":  lambda a: tool_list_community_tools(),
    # Frontier Tools: AI / NLP / IoT / Learning (Frontiers #1-3)
    "nlp_intent":           lambda a: tool_nlp_intent(a.get("text", "")),
    "lumenis_chat":         lambda a: tool_lumenis_chat(a.get("message", ""), a.get("session_id", "")),
    "learning_status":      lambda a: tool_learning_status(),
    "iot_event":            lambda a: tool_iot_event(a.get("sensor", ""), a.get("value", ""), a.get("unit", "")),
    "voice_parse":          lambda a: tool_voice_parse(a.get("transcript", "")),
}


def _delete_game(game_id: str) -> str:
    gid = game_id.upper().strip()
    if gid not in games:
        return f"Game '{gid}' not found."
    if games[gid]["status"] == "active":
        return "Cannot delete active game. Use resign_game() first."
    del games[gid]
    return f"Game {gid} deleted."


# ────────────────────────────────────────────────────────────
# MCP JSON-RPC HANDLER
# ────────────────────────────────────────────────────────────

async def handle_jsonrpc(msg: dict) -> Optional[dict]:
    method = msg.get("method", "")
    params = msg.get("params") or {}
    msg_id = msg.get("id")

    if msg_id is None and method.startswith("notifications/"):
        return None

    def ok(result):
        return {"jsonrpc": "2.0", "id": msg_id, "result": result}

    def err(code, message):
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": code, "message": message}}

    if method == "initialize":
        return ok({
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "AI Arcade", "version": "2.0.0"},
        })
    if method == "ping":
        return ok({})
    if method == "tools/list":
        category_filter = params.get("category", "")
        tools = TOOLS
        # Include registered community tools dynamically
        community = [
            {"name": n, "category": "Community", "description": t["description"], "inputSchema": t["schema"]}
            for n, t in _community_tools.items()
        ]
        all_tools = tools + community
        if category_filter:
            all_tools = [t for t in all_tools if t.get("category", "").lower() == category_filter.lower()]
        return ok({"tools": all_tools})
    if method == "tools/call":
        name = params.get("name", "")
        arguments = params.get("arguments") or {}
        # Check community tools first
        if name in _community_tools:
            ct = _community_tools[name]
            ct["calls"] += 1
            t0 = time.monotonic()
            try:
                r = _api_call(ct["endpoint"], method="POST", data=arguments)
                duration_ms = round((time.monotonic() - t0) * 1000, 2)
                _record_call(name, duration_ms, r["ok"])
                text = json.dumps(r.get("data", r.get("error", r)), indent=2) if not isinstance(r.get("data"), str) else r["data"]
                return ok({"content": [{"type": "text", "text": str(text)[:4000]}]})
            except Exception as e:
                _record_call(name, round((time.monotonic() - t0) * 1000, 2), False)
                return err(-32603, f"Community tool error: {e}")
        fn = TOOL_MAP.get(name)
        if not fn:
            return err(-32601, f"Unknown tool: {name}")
        t0 = time.monotonic()
        try:
            text = fn(arguments)
            duration_ms = round((time.monotonic() - t0) * 1000, 2)
            _record_call(name, duration_ms, True)
        except KeyError as e:
            _record_call(name, round((time.monotonic() - t0) * 1000, 2), False)
            return err(-32602, f"Missing argument: {e}")
        except Exception as e:
            _record_call(name, round((time.monotonic() - t0) * 1000, 2), False)
            return err(-32603, f"Tool error: {type(e).__name__}: {e}")
        return ok({"content": [{"type": "text", "text": text}]})
    return err(-32601, f"Method not found: {method}")


# ────────────────────────────────────────────────────────────
# HTTP ENDPOINTS
# ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    playable = [k for k, v in GAME_LIBRARY.items() if v.get("status") == "playable"]
    return {
        "name": "AI Arcade MCP Server",
        "version": "2.0.0",
        "protocol": "MCP 2024-11-05",
        "transports": ["HTTP+SSE (/sse + /messages)", "Streamable HTTP (/mcp)"],
        "playable_games": playable,
        "total_library": len(GAME_LIBRARY),
        "tools": [t["name"] for t in TOOLS],
        "active_sessions": sum(1 for g in games.values() if g["status"] == "active"),
    }


@app.get("/sse")
async def sse_endpoint(request: Request):
    session_id = str(uuid.uuid4())
    queue: asyncio.Queue = asyncio.Queue()
    sessions[session_id] = queue

    async def event_stream():
        yield {"event": "endpoint", "data": f"/messages?session_id={session_id}"}
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=25.0)
                    if msg is None:
                        break
                    yield {"event": "message", "data": json.dumps(msg)}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}
        finally:
            sessions.pop(session_id, None)

    return EventSourceResponse(event_stream())


@app.post("/messages")
async def messages_endpoint(session_id: str, request: Request):
    if not _check_auth(request):
        return Response(content='{"error":"Unauthorized — provide Authorization: Bearer <MCP_API_KEY>"}',
                        status_code=401, media_type="application/json")
    try:
        body = await request.json()
    except Exception:
        return Response(content='{"error":"invalid JSON"}', status_code=400, media_type="application/json")
    response = await handle_jsonrpc(body)
    if response is not None and session_id in sessions:
        await sessions[session_id].put(response)
    return Response(status_code=202)


@app.post("/mcp")
async def mcp_endpoint(request: Request):
    """Streamable HTTP transport — single-endpoint synchronous response."""
    if not _check_auth(request):
        return Response(content='{"error":"Unauthorized — provide Authorization: Bearer <MCP_API_KEY>"}',
                        status_code=401, media_type="application/json")
    try:
        body = await request.json()
    except Exception:
        return Response(content='{"error":"invalid JSON"}', status_code=400, media_type="application/json")
    response = await handle_jsonrpc(body)
    if response is None:
        return Response(status_code=204)
    return Response(content=json.dumps(response), media_type="application/json")


@app.get("/metrics")
async def metrics_endpoint():
    """Live tool usage metrics — call counts, error rates, average latency."""
    summary = {}
    for name, m in _metrics.items():
        summary[name] = {
            "calls": m["calls"],
            "errors": m["errors"],
            "error_rate_pct": round(m["errors"] / m["calls"] * 100, 1) if m["calls"] else 0,
            "avg_ms": m["avg_ms"],
            "total_ms": m["total_ms"],
            "last_called": m["last_called"],
        }
    return {
        "tools_called": len(summary),
        "total_calls": sum(m["calls"] for m in _metrics.values()),
        "total_errors": sum(m["errors"] for m in _metrics.values()),
        "community_tools": len(_community_tools),
        "breakdown": summary,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI Arcade MCP Server")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    playable = [k for k, v in GAME_LIBRARY.items() if v.get("status") == "playable"]
    print(f"\n  AI ARCADE MCP SERVER v2.0")
    print(f"  ==========================")
    print(f"  URL      : http://{args.host}:{args.port}")
    print(f"  SSE      : http://{args.host}:{args.port}/sse")
    print(f"  MCP POST : http://{args.host}:{args.port}/mcp")
    print(f"\n  Playable : {', '.join(playable)}")
    print(f"  Library  : {len(GAME_LIBRARY)} titles total")
    print(f"  Tools    : {len(TOOLS)}")
    print()

    uvicorn.run(app, host=args.host, port=args.port)
