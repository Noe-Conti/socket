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
    x = requests.post(url, json=myobj)


def cpuPush():
    cpu = psutil.cpu_percent()
    url = f"{BACKEND_URL}/metric/cpu"
    myobj = {
        'cpu_pourcentage': cpu,
        'hostname': HOSTNAME,
        'ip': IP
    }
    x = requests.post(url, json=myobj)


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
    x = requests.post(url, json=myobj)


print(f"Agent démarré sur {HOSTNAME} ({IP})")

while True:
    ramPush()
    cpuPush()
    openportsPush()
    time.sleep(3)