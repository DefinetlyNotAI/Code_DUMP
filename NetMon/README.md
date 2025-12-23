---

# NetMon: A Simple Windows SysAdmin Panel for Network Monitoring

NetMon is a lightweight and simple network monitoring tool designed to run on Windows, ideal for sysadmins and network professionals. It allows you to monitor system and network data locally through a Flask-based interface. 

> [!NOTE]  
> This application is designed to run locally, not on a production server. The Flask development server is intentionally used.

---

## Features

- Monitor active network connections (TCP).
- View network adapter status and details.
- Retrieve system DNS and firewall information.
- Visualize recent network packet data.
- Localized, browser-accessible dashboard.

---

## Prerequisites

Before running NetMon, ensure you have the following installed:

- Python 3.7+ (recommended)
- pip (Python package manager)
- Windows operating system (for the PowerShell commands)

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/DefinetlyNotAI/NetMon.git
cd NetMon
```

### 2. Install dependencies

Install required Python packages using `pip`:

```bash
pip install -r requirements.txt
```

---

## Usage

1. **Run the application**  
   Start the network monitoring script:

   ```bash
   python NetMon.py
   ```

2. **Access the dashboard**  
   In your browser, go to the following address:

   ```plaintext
   http://127.0.0.1:5000
   ```

   You can change the first part of the URL (127) to any number between 127 and 255. The port number must remain `5000`.

3. **Enjoy monitoring your network panel**  
   You will now see real-time network data and system information on the dashboard.

---

## Core Functionality

- **PowerShell Integration**: Executes PowerShell commands to retrieve network and system data on Windows.
- **Network Monitoring**: Captures active TCP connections and simulated packet data (future enhancements to support real packet capture).
- **Flask Web Interface**: Serves a local web interface displaying system and network data.

---

## API Endpoints

NetMon provides a couple of API endpoints to fetch system and network data:

- **GET `/api/system_info`**  
  Returns a JSON object with the following information:
  - Network adapters
  - DNS servers
  - Active connections
  - Firewall rules

- **GET `/api/network_data`**  
  Returns a JSON object containing:
  - Recent packet data (simulated)
  - Connection history (TCP connections)

---

## How It Works

### PowerShell Commands
NetMon leverages PowerShell commands to extract key network and system information:

- **Network Adapter Info**: Lists active network adapters with name, status, and link speed.
- **IP Address Info**: Provides details of network interfaces and IP addresses.
- **Active Connections**: Tracks active TCP connections on the system.
- **DNS Info**: Retrieves DNS servers configured on the system.
- **Firewall Rules**: Shows enabled firewall rules.

### Network Monitoring
NetMon continuously tracks active TCP connections and simulates packet data, capturing this information every second. It stores this data in `deque` structures to efficiently manage recent network activity and display it in real-time.

---

## Development & Contributions

NetMon is open-source and welcomes contributions. If you'd like to contribute, feel free to:

- Fork the repository
- Create a feature branch
- Submit a pull request

Please ensure any changes are well-tested and documented.

---

## Troubleshooting

- **Issue**: "The application is not accessible on the browser."
  - **Solution**: Ensure you are running the Flask application on `127.0.0.1` and port `5000`.
  
- **Issue**: "PowerShell command errors."
  - **Solution**: Check that PowerShell is available on your system, and that the necessary network configuration is accessible.

---

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---
