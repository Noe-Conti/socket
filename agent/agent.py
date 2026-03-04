import psutil
import time
import requests

def ramPush():
    ram = psutil.virtual_memory()
    url = "http://localhost:8080/metric/ram"
    myobj = {'ram_pourcentage': ram.percent}
    x = requests.post(url, json = myobj)

def cpuPush():
    cpu = psutil.cpu_percent()
    url = "http://localhost:8080/metric/cpu"
    myobj = {'cpu_pourcentage': cpu}
    x = requests.post(url, json = myobj)

def openportsPush():
    connections = psutil.net_connections()
    openports = [conn.laddr.port for conn in connections if conn.status == 'LISTEN']
    
    url = "http://localhost:8080/metric/openports"
    myobj = {'openports': openports}
    x = requests.post(url, json = myobj)

while True:
    ramPush()
    cpuPush()
    openportsPush()
    time.sleep(3)



