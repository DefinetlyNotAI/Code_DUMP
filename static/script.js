// Initialize network graph
const networkGraph = document.getElementById('networkGraph');
Plotly.newPlot(networkGraph, [{
    x: [],
    y: [],
    type: 'scatter',
    mode: 'lines',
    name: 'Network Activity',
    line: {
        color: '#10b981',
        width: 2
    },
    fill: 'tozeroy',
    fillcolor: 'rgba(16, 185, 129, 0.1)'
}], {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#fff' },
    margin: { t: 10, r: 10, l: 50, b: 40 },
    xaxis: {
        gridcolor: '#374151',
        title: 'Time',
        showgrid: true,
        zeroline: false
    },
    yaxis: {
        gridcolor: '#374151',
        title: 'Packets',
        showgrid: true,
        zeroline: false
    }
});

// Auto-refresh control
let refreshInterval;
const refreshToggle = document.getElementById('refreshToggle');
const REFRESH_INTERVAL = 1000; // 1 second

function startAutoRefresh() {
    refreshInterval = setInterval(updateData, REFRESH_INTERVAL);
    refreshToggle.classList.add('active');
}

function stopAutoRefresh() {
    clearInterval(refreshInterval);
    refreshToggle.classList.remove('active');
}

refreshToggle.addEventListener('click', () => {
    if (refreshToggle.classList.contains('active')) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
    }
});

// Keyboard accessibility
refreshToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        refreshToggle.click();
    }
});

// Update data function
function updateData() {
    $.get('/api/network_data', function(data) {
        // Update network graph
        const timestamps = data.packets.map(p => p.timestamp);
        const packetCounts = data.packets.map((_, i) => i + 1);

        Plotly.update(networkGraph, {
            x: [timestamps],
            y: [packetCounts]
        });

        // Update connections table
        const connectionsHtml = data.connections.slice(-10).map(conn => {
            const connections = conn.connections;
            return connections.map(c => `
                        <tr class="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                            <td class="py-2">${c.LocalAddress}:${c.LocalPort}</td>
                            <td class="py-2">${c.RemoteAddress}:${c.RemotePort}</td>
                            <td class="py-2">
                                <span class="status-indicator ${c.State === 'Established' ? 'status-up' : 'status-down'}"></span>
                                ${c.State}
                            </td>
                        </tr>
                    `).join('');
        }).join('');
        $('#connectionsTable').html(connectionsHtml);
    });

    // Update system info
    $.get('/api/system_info', function(data) {
        // Update network adapters
        const adaptersHtml = data.network_adapters.map(adapter => `
                    <div class="p-4 glass-effect rounded-lg animate-fade-in">
                        <div class="flex items-center">
                            <span class="status-indicator ${adapter.Status === 'Up' ? 'status-up' : 'status-down'}"></span>
                            <div class="font-semibold">${adapter.Name}</div>
                        </div>
                        <div class="text-sm text-gray-400 mt-2">
                            Status: ${adapter.Status}<br>
                            Speed: ${adapter.LinkSpeed}
                        </div>
                    </div>
                `).join('');
        $('#networkAdapters').html(adaptersHtml);

        // Update IP info
        const ipHtml = data.ip_info.map(ip => `
                    <div class="p-4 glass-effect rounded-lg animate-fade-in">
                        <div class="font-semibold">${ip.IPAddress}</div>
                        <div class="text-sm text-gray-400 mt-2">
                            Interface: ${ip.InterfaceAlias}<br>
                            Prefix Length: ${ip.PrefixLength}
                        </div>
                    </div>
                `).join('');
        $('#ipInfo').html(ipHtml);

        // Update firewall rules
        const firewallHtml = data.firewall_rules.map(rule => `
                    <tr class="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                        <td class="py-2">${rule.Name}</td>
                        <td class="py-2">
                            <span class="px-2 py-1 rounded-full text-xs ${
            rule.Direction === 'Inbound' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'
        }">${rule.Direction}</span>
                        </td>
                        <td class="py-2">
                            <span class="px-2 py-1 rounded-full text-xs ${
            rule.Action === 'Allow' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
        }">${rule.Action}</span>
                        </td>
                        <td class="py-2">${rule.Profile}</td>
                    </tr>
                `).join('');
        $('#firewallTable').html(firewallHtml);
    });
}

// Initial update and start auto-refresh
updateData();
startAutoRefresh();
