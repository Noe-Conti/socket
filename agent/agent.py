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

while True:
    ramPush()
    cpuPush()
    time.sleep(3)



