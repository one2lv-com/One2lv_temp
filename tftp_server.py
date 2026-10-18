#!/usr/bin/env python3
"""
One2lvOS Real TFTP Server — RFC 1350
Serves BIOS, Kernel and OS files to PXE clients over UDP.
Default port: 6969 (use 69 as root for real PXE hardware).
"""

import os
import sys
import socket
import struct
import threading
import time

# TFTP opcodes
OP_RRQ   = 1   # Read request
OP_DATA  = 3   # Data packet
OP_ACK   = 4   # Acknowledgement
OP_ERROR = 5   # Error

# TFTP error codes
ERR_NOT_FOUND  = 1
ERR_ACCESS     = 2
ERR_ILLEGAL_OP = 4

BLOCK_SIZE = 512


def make_data(block_num: int, data: bytes) -> bytes:
    return struct.pack("!HH", OP_DATA, block_num) + data

def make_error(code: int, msg: str) -> bytes:
    return struct.pack("!HH", OP_ERROR, code) + msg.encode() + b"\x00"

def parse_rrq(packet: bytes):
    """Parse a RRQ packet → (filename, mode)."""
    # Format: opcode(2) + filename + 0x00 + mode + 0x00
    parts = packet[2:].split(b"\x00")
    filename = parts[0].decode("ascii", errors="replace")
    mode     = parts[1].decode("ascii", errors="replace") if len(parts) > 1 else "octet"
    return filename, mode.lower()


class TFTPServer:
    def __init__(self, root_dir: str, host: str = "0.0.0.0", port: int = 6969):
        self.root  = os.path.abspath(root_dir)
        self.host  = host
        self.port  = port
        self.running = False

    # -----------------------------------------------------------------------
    def resolve_path(self, filename: str):
        """
        Map a TFTP filename to a real file path.
        Search order:
          1. root / filename
          2. root / One2lvOS / filename
          3. root / One2lvOS/BIOS / filename
          4. root / One2lvOS/Kernel / filename
        """
        filename = filename.lstrip("/")
        candidates = [
            os.path.join(self.root, filename),
            os.path.join(self.root, "One2lvOS", filename),
            os.path.join(self.root, "One2lvOS", "BIOS",   os.path.basename(filename)),
            os.path.join(self.root, "One2lvOS", "Kernel", os.path.basename(filename)),
        ]
        for c in candidates:
            real = os.path.realpath(c)
            if real.startswith(self.root) and os.path.isfile(real):
                return real
        return None

    # -----------------------------------------------------------------------
    def handle_client(self, data: bytes, addr: tuple, sock: socket.socket):
        """Handle one RRQ in its own thread."""
        opcode = struct.unpack("!H", data[:2])[0]
        if opcode != OP_RRQ:
            sock.sendto(make_error(ERR_ILLEGAL_OP, "Only read requests supported"), addr)
            return

        filename, mode = parse_rrq(data)
        path = self.resolve_path(filename)

        if path is None:
            print(f"  [TFTP] NOT FOUND  {filename}  ← {addr[0]}")
            sock.sendto(make_error(ERR_NOT_FOUND, f"File not found: {filename}"), addr)
            return

        size = os.path.getsize(path)
        print(f"  [TFTP] SEND  {filename}  ({size:,} bytes)  → {addr[0]}:{addr[1]}")

        # Open a dedicated UDP socket for this transfer (separate ephemeral port)
        xfr = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        xfr.settimeout(5.0)

        try:
            with open(path, "rb") as f:
                block_num = 1
                while True:
                    chunk = f.read(BLOCK_SIZE)
                    packet = make_data(block_num, chunk)

                    retries = 0
                    while retries < 5:
                        xfr.sendto(packet, addr)
                        try:
                            ack_data, _ = xfr.recvfrom(4)
                            ack_op, ack_block = struct.unpack("!HH", ack_data[:4])
                            if ack_op == OP_ACK and ack_block == block_num:
                                break
                        except socket.timeout:
                            retries += 1

                    if retries >= 5:
                        print(f"  [TFTP] TIMEOUT {filename} block {block_num}")
                        return

                    if len(chunk) < BLOCK_SIZE:
                        # Last block sent and ACKed
                        print(f"  [TFTP] DONE  {filename}")
                        break

                    block_num = (block_num + 1) & 0xFFFF  # wrap at 65535

        except Exception as e:
            print(f"  [TFTP] ERROR {filename}: {e}")
            try:
                xfr.sendto(make_error(ERR_ACCESS, str(e)), addr)
            except Exception:
                pass
        finally:
            xfr.close()

    # -----------------------------------------------------------------------
    def start(self):
        self.running = True
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((self.host, self.port))
        except PermissionError:
            print(f"[TFTP] Permission denied on port {self.port}. Run as root for port 69.")
            return
        except OSError as e:
            print(f"[TFTP] Could not bind port {self.port}: {e}")
            return

        print(f"[TFTP] Listening on {self.host}:{self.port}  root={self.root}")
        while self.running:
            try:
                sock.settimeout(1.0)
                data, addr = sock.recvfrom(1024)
                t = threading.Thread(target=self.handle_client,
                                     args=(data, addr, sock), daemon=True)
                t.start()
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f"[TFTP] Error: {e}")
        sock.close()

    def stop(self):
        self.running = False


if __name__ == "__main__":
    root = os.path.dirname(os.path.abspath(__file__))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 6969
    server = TFTPServer(root_dir=root, port=port)
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()
        print("\n[TFTP] Stopped.")
