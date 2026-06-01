from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ram(BaseModel):
    ram_pourcentage: float
    hostname: str = None
    ip: str = None
    time_stamp: datetime = None

class cpu(BaseModel):
    cpu_pourcentage: float
    hostname: str = None
    ip: str = None

class ports(BaseModel):
    openports: list[int]
    hostname: str = None
    ip: str = None

class disk(BaseModel):
    disk_pourcentage: float
    disk_total_go: float
    disk_used_go: float
    hostname: str = None
    ip: str = None

class processes(BaseModel):
    processes: list[str]
    hostname: str = None
    ip: str = None

class Connection(BaseModel):
    local_port: int
    remote_ip: str
    remote_port: int

class connections(BaseModel):
    connections: list[Connection]
    hostname: str = None
    ip: str = None


ram_usage = []
cpu_usage = []
openports = []
disk_usage = []
processes_list = []
connections_list = []

#Ne stock les infos qu'une seule fois chacune (pas de doublons)
#Les posts envoie le hostname à chaque fois, mais si déjà présent, ne changera rien
known_machines = set() 


#### RAM #####
@app.post("/metric/ram")
def post_ram_info(item: ram):
    #Si hostname existe (non None) on l'ajoute à known_machines 
    if item.hostname:
        known_machines.add(item.hostname)
    item.time_stamp = datetime.now(timezone.utc) #Timezone utc pour éviter les écarts de fuseaux horraires
    ram_usage.append(item)
    return item

@app.get("/metric/ram")
def get_all_ram(hostname: str = None):
    #Si get fait avec hostname particulier, on return que ce qui correspond
    #Sinon on return tout
    if hostname:
        return [r for r in ram_usage if r.hostname == hostname]
    return ram_usage


#### CPU #####
@app.post("/metric/cpu")
def post_cpu_info(item: cpu):
    if item.hostname:
        known_machines.add(item.hostname)
    cpu_usage.append(item)
    return item

@app.get("/metric/cpu")
def get_all_cpu(hostname: str = None):
    if hostname:
        return [r for r in cpu_usage if r.hostname == hostname]
    return cpu_usage


#### Open Ports ####
@app.post("/metric/openports")
def post_openports_info(item: ports):
    if item.hostname:
        known_machines.add(item.hostname)
    openports.append(item)
    return item

@app.get("/metric/openports")
def get_all_openports(hostname: str = None):
    if hostname:
        return [r for r in openports if r.hostname == hostname]
    return openports


#### Disk ####
@app.post("/metric/disk")
def post_disk_info(item: disk):
    if item.hostname:
        known_machines.add(item.hostname)
    disk_usage.append(item)
    return item

@app.get("/metric/disk")
def get_disk_usage(hostname: str = None):
    if hostname:
        return [r for r in disk_usage if r.hostname == hostname]
    return disk_usage


#### Processes ####
@app.post("/metric/processes")
def post_processes_info(item: processes):
    if item.hostname:
        known_machines.add(item.hostname)
    processes_list.append(item)
    return item

@app.get("/metric/processes")
def get_all_processes(hostname: str = None):
    if hostname:
        return [r for r in processes_list if r.hostname == hostname]
    return processes_list


#### Connections ####
@app.post("/metric/connections")
def post_connections_info(item: connections):
    if item.hostname:
        known_machines.add(item.hostname)
    connections_list.append(item)
    return item

@app.get("/metric/connections")
def get_all_connections(hostname: str = None):
    if hostname:
        return [r for r in connections_list if r.hostname == hostname]
    return connections_list


#### Machines ####
@app.get("/metric/machines")
def get_machines():
    return list(known_machines)
