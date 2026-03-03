import psutil
import time
import requests

def ramPush():
    ram = psutil.virtual_memory()
    url = "http://localhost:8080/metric/ram"
    myobj = {'ram_pourcentage': ram.percent}
    x = requests.post(url, json = myobj)

while True:
    ramPush()
    time.sleep(3)

#print(ram.percent)
# print("CPU usage (%):", psutil.cpu_percent(interval=1))
#print("RAM used (GB):", round(ram.used / 1e9, 2))


