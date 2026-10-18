#!/usr/bin/env python3
"""
One2lvOS SSH Server
Runs a Paramiko-based SSH server on port 2222.
Accepts password auth and executes commands in a subprocess shell.
"""

import os
import socket
import subprocess
import threading
import sys
from pathlib import Path

import paramiko

PORT = int(os.environ.get("SSH_PORT", 2222))
SSH_USER = os.environ.get("SSH_USER", "one2lv")
SSH_PASS = os.environ.get("SSH_PASS", "sovereign")
HOST_KEY_PATH = os.environ.get("SSH_HOST_KEY", str(Path(__file__).parent / ".ssh_host_key"))

# Generate or load host key
key_path = Path(HOST_KEY_PATH)
if not key_path.exists():
    key_path.parent.mkdir(parents=True, exist_ok=True)
    host_key = paramiko.RSAKey.generate(2048)
    host_key.write_private_key_file(str(key_path))
    print(f"  Generated host key: {key_path}")
else:
    host_key = paramiko.RSAKey(filename=str(key_path))
    print(f"  Loaded host key: {key_path}")


class One2lvOSServerInterface(paramiko.ServerInterface):
    def __init__(self):
        self.event = threading.Event()

    def check_channel_request(self, kind, chanid):
        if kind == "session":
            return paramiko.OPEN_SUCCEEDED
        return paramiko.OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def check_auth_password(self, username, password):
        if username == SSH_USER and password == SSH_PASS:
            return paramiko.AUTH_SUCCESSFUL
        return paramiko.AUTH_FAILED

    def check_auth_none(self, username):
        return paramiko.AUTH_FAILED

    def get_allowed_auths(self, username):
        return "password"

    def check_channel_shell_request(self, channel):
        self.event.set()
        return True

    def check_channel_exec_request(self, channel, command):
        self.event.set()
        self._exec_command = command
        return True

    def check_channel_pty_request(self, channel, term, width, height, pixelwidth, pixelheight, modes):
        return True


def handle_client(client_sock, addr):
    print(f"  Connection from {addr[0]}:{addr[1]}")
    transport = paramiko.Transport(client_sock)
    transport.add_server_key(host_key)
    transport.local_version = "SSH-2.0-One2lvOS_1.0"

    server_iface = One2lvOSServerInterface()
    try:
        transport.start_server(server=server_iface)
    except paramiko.SSHException as e:
        print(f"  SSH negotiation failed: {e}")
        return

    chan = transport.accept(20)
    if chan is None:
        print(f"  No channel from {addr[0]}")
        return

    server_iface.event.wait(10)

    # Check if it's an exec request
    exec_cmd = getattr(server_iface, "_exec_command", None)

    banner = (
        "ONE2LVOS SSH SERVER v1.0\r\n"
        "========================\r\n"
        "Sovereign shell access. Welcome.\r\n\r\n"
    )

    if exec_cmd:
        # Non-interactive exec
        cmd_str = exec_cmd.decode() if isinstance(exec_cmd, bytes) else exec_cmd
        try:
            result = subprocess.run(
                cmd_str, shell=True, capture_output=True, text=True, timeout=30,
                cwd=str(Path(__file__).parent)
            )
            chan.sendall(result.stdout.encode())
            if result.stderr:
                chan.sendall_stderr(result.stderr.encode())
            chan.send_exit_status(result.returncode)
        except subprocess.TimeoutExpired:
            chan.sendall_stderr(b"Command timed out (30s)\n")
            chan.send_exit_status(1)
        chan.close()
        return

    # Interactive shell
    chan.sendall(banner.encode())
    chan.sendall(b"$ ")

    buf = b""
    try:
        while transport.is_active():
            data = chan.recv(1024)
            if not data:
                break
            # Echo back
            chan.sendall(data)
            buf += data
            if b"\r" in buf or b"\n" in buf:
                line = buf.replace(b"\r\n", b"\n").replace(b"\r", b"\n").decode(errors="replace").strip()
                buf = b""
                if line.lower() in ("exit", "quit", "logout"):
                    chan.sendall(b"\r\nGoodbye.\r\n")
                    break
                if line:
                    try:
                        result = subprocess.run(
                            line, shell=True, capture_output=True, text=True, timeout=30,
                            cwd=str(Path(__file__).parent)
                        )
                        out = result.stdout + result.stderr
                        chan.sendall(("\r\n" + out.replace("\n", "\r\n")).encode())
                    except subprocess.TimeoutExpired:
                        chan.sendall(b"\r\nTimeout (30s)\r\n")
                    except Exception as e:
                        chan.sendall(f"\r\nError: {e}\r\n".encode())
                chan.sendall(b"$ ")
    except Exception as e:
        print(f"  Session error: {e}")
    finally:
        chan.close()
        print(f"  Disconnected {addr[0]}")


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(("0.0.0.0", PORT))
    sock.listen(10)

    print(f"ONE2LVOS SSH SERVER")
    print(f"  Port     : {PORT}")
    print(f"  User     : {SSH_USER}")
    print(f"  Connect  : ssh {SSH_USER}@localhost -p {PORT}")
    print()

    while True:
        try:
            client, addr = sock.accept()
            t = threading.Thread(target=handle_client, args=(client, addr), daemon=True)
            t.start()
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"  Accept error: {e}")


if __name__ == "__main__":
    main()
