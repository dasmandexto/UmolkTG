#!/usr/bin/env python3
import sys
import os
import json
import sqlite3
import socket
import struct
import base64

def parse_session_file(session_path):
    if not os.path.exists(session_path):
        return {"valid": False, "error": f"File not found: {session_path}"}
    
    try:
        conn = sqlite3.connect(session_path)
        cur = conn.cursor()
        
        # Check sessions table
        cur.execute("SELECT dc_id, server_address, port, auth_key FROM sessions")
        row = cur.fetchone()
        if not row or not row[3]:
            return {"valid": False, "error": "No valid auth_key found in sessions table"}
        
        dc_id, server_address, port, auth_key = row
        if not isinstance(auth_key, (bytes, bytearray)) or len(auth_key) < 256:
            return {"valid": False, "error": f"Invalid auth_key length: {len(auth_key) if auth_key else 0}"}

        # IP packed
        try:
            ip_packed = socket.inet_aton(server_address)
        except Exception:
            # Fallback default DC addresses
            dc_defaults = {
                1: "149.154.175.50",
                2: "149.154.167.50",
                3: "149.154.175.100",
                4: "149.154.167.91",
                5: "91.108.56.165"
            }
            server_address = dc_defaults.get(dc_id, "149.154.167.50")
            ip_packed = socket.inet_aton(server_address)

        port_val = int(port) if port else 443

        # GramJS / Telethon StringSession encoding
        # format: 1 (version) + dc_id (1 byte) + ip_packed (4 bytes) + port (2 bytes) + auth_key (256 bytes)
        raw_bytes = struct.pack(">B", int(dc_id)) + ip_packed + struct.pack(">H", port_val) + auth_key[:256]
        string_session = "1" + base64.urlsafe_b64encode(raw_bytes).decode("ascii")

        return {
            "valid": True,
            "dcId": dc_id,
            "serverAddress": server_address,
            "port": port_val,
            "authKeyHex": auth_key[:256].hex(),
            "stringSession": string_session
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"valid": False, "error": "Usage: session_parser.py <path_to_session_file>"}))
        sys.exit(1)

    result = parse_session_file(sys.argv[1])
    print(json.dumps(result))
