import psutil
import time
import requests
import socket

# Identification de la machine
HOSTNAME = socket.gethostname()
try:
    IP = socket.gethostbyname(HOSTNAME)
except Exception:
    IP = "unknown"

BACKEND_URL = "http://localhost:80"


def ramPush():
    ram = psutil.virtual_memory()
    url = f"{BACKEND_URL}/metric/ram"
    myobj = {
        'ram_pourcentage': ram.percent,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj)


def cpuPush():
    cpu = psutil.cpu_percent()
    url = f"{BACKEND_URL}/metric/cpu"
    myobj = {
        'cpu_pourcentage': cpu,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj)


def openportsPush():
    try:
        connections = psutil.net_connections()
    except psutil.AccessDenied:
        connections = psutil.net_connections(kind='inet')

    openports = list(set([
        conn.laddr.port for conn in connections if conn.status == 'LISTEN'
    ]))

    url = f"{BACKEND_URL}/metric/openports"
    myobj = {
        'openports': openports,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj)


def diskPush():
    disk = psutil.disk_usage('/')
    url = f"{BACKEND_URL}/metric/disk"
    myobj = {
        'disk_pourcentage': disk.percent,
        'disk_total_go': round(disk.total / (1024**3), 2),
        'disk_used_go': round(disk.used / (1024**3), 2),
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj)


def processesPush():
    try:
        processes = list(set([p.name() for p in psutil.process_iter(['name'])]))
    except psutil.AccessDenied:
        processes = []

    url = f"{BACKEND_URL}/metric/processes"
    myobj = {
        'processes': processes,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj)


def connectionsPush():
    try:
        conns = psutil.net_connections()
        active = [
            {'local_port': c.laddr.port, 'remote_ip': c.raddr[0], 'remote_port': c.raddr[1]}
            for c in conns if c.status == 'ESTABLISHED' and c.raddr
        ]
    except psutil.AccessDenied:
        active = []

    url = f"{BACKEND_URL}/metric/connections"
    myobj = {
        'connections': active,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj)


print(f"Agent démarré sur {HOSTNAME} ({IP})")

while True:
    ramPush()
    cpuPush()
    openportsPush()
    diskPush()
    processesPush()
    connectionsPush()
    time.sleep(3)