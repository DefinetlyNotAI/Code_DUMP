import datetime
import json
import logging
import subprocess
import threading
import time
from collections import deque

from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store recent network data
packet_history = deque(maxlen=1000)
connection_history = deque(maxlen=500)


def run_powershell_command(command):
    try:
        result = subprocess.run(["powershell", "-Command", command],
                                capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        logger.error(f"Error running PowerShell command: {e}")
        return str(e)


def get_system_info():
    commands = {
        'ip_info': 'Get-NetIPAddress | Select-Object IPAddress,InterfaceAlias,PrefixLength | ConvertTo-Json',
        'network_adapters': 'Get-NetAdapter | Select-Object Name,Status,LinkSpeed | ConvertTo-Json',
        'active_connections': 'Get-NetTCPConnection | Where-Object State -eq "Established" | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State | ConvertTo-Json',
        'dns_servers': 'Get-DnsClientServerAddress | Select-Object InterfaceAlias,ServerAddresses | ConvertTo-Json',
        'firewall_rules': 'Get-NetFirewallRule | Where-Object Enabled -eq "True" | Select-Object Name,Direction,Action,Profile | ConvertTo-Json'
    }

    results = {}
    for key, command in commands.items():
        results[key] = json.loads(run_powershell_command(command) or '[]')
    return results


def monitor_network():
    while True:
        try:
            # Get current network stats
            connections = json.loads(run_powershell_command(
                'Get-NetTCPConnection | Where-Object State -eq "Established" | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State | ConvertTo-Json'
            ) or '[]')

            # Add timestamp
            timestamp = datetime.datetime.now().isoformat()
            connection_history.append({
                'timestamp': timestamp,
                'connections': connections
            })

            # Simulate packet capture (replace with actual packet capture when running on Windows)
            packet_data = {
                'timestamp': timestamp,
                'size': 1500,
                'protocol': 'TCP',
                'source': connections[0]['LocalAddress'] if connections else '127.0.0.1',
                'destination': connections[0]['RemoteAddress'] if connections else '127.0.0.1'
            }
            packet_history.append(packet_data)

            time.sleep(1)
        except Exception as e:
            logger.error(f"Error in network monitoring: {e}")
            time.sleep(5)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/system_info')
def api_system_info():
    return jsonify(get_system_info())


@app.route('/api/network_data')
def api_network_data():
    return jsonify({
        'packets': list(packet_history),
        'connections': list(connection_history)
    })


if __name__ == '__main__':
    # Start network monitoring in a background thread
    monitor_thread = threading.Thread(target=monitor_network, daemon=True)
    monitor_thread.start()

    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)