import os
import psutil
import time
import requests
import socket
import logging
from logging.handlers import SysLogHandler

# Identification de la machine
HOSTNAME = socket.gethostname()
try:
    IP = socket.gethostbyname(HOSTNAME)
except Exception:
    IP = "unknown"

BACKEND_URL = os.environ["BACKEND_URL"]

CA_CERT   = "/certs/ca.crt"
AGENT_CERT = ("/certs/agent.crt", "/certs/agent.key")

SYSLOG_FILE = "/var/log/syslog"

logger = logging.getLogger("agent")
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())
try:
    logger.addHandler(SysLogHandler(address="/dev/log"))
except OSError:
    pass  # rsyslog pas encore prêt / indisponible : on garde au moins la sortie standard


def ramPush():
    ram = psutil.virtual_memory()
    url = f"{BACKEND_URL}/metric/ram"
    myobj = {
        'ram_pourcentage': ram.percent,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT)


def cpuPush():
    cpu = psutil.cpu_percent()
    url = f"{BACKEND_URL}/metric/cpu"
    myobj = {
        'cpu_pourcentage': cpu,
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT)


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
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT)


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
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT)


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
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT) #Vérifie l'authenticité du serveur, et requests gère le chiffrement dès que la handshake est établie


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
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT)


_log_offset = 0
_syslog_missing_warned = False

def logsPush():
    global _log_offset, _syslog_missing_warned
    try:
        if os.path.getsize(SYSLOG_FILE) < _log_offset:
            _log_offset = 0  # fichier tronqué/pivoté (logrotate) : on repart du début

        with open(SYSLOG_FILE, "r", errors="replace") as f:
            f.seek(_log_offset)
            new_lines = f.readlines()
            _log_offset = f.tell()
        _syslog_missing_warned = False
    except FileNotFoundError:
        if not _syslog_missing_warned:
            logger.warning(f"{SYSLOG_FILE} introuvable : rsyslog n'a probablement pas démarré")
            _syslog_missing_warned = True
        return

    if not new_lines:
        return  # rien de nouveau depuis le dernier envoi

    url = f"{BACKEND_URL}/metric/logs"
    myobj = {
        'logs': [line.rstrip("\n") for line in new_lines],
        'hostname': HOSTNAME,
        'ip': IP
    }
    requests.post(url, json=myobj, verify=CA_CERT, cert=AGENT_CERT)


logger.info(f"Agent démarré sur {HOSTNAME} ({IP})")

while True:
    for push in (ramPush, cpuPush, openportsPush, diskPush, processesPush, connectionsPush, logsPush):
        try:
            push()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erreur d'envoi vers le backend ({push.__name__}): {e}")
    time.sleep(3)