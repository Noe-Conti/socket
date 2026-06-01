from fastapi import FastAPI, HTTPException
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


#### RAM #####
@app.post("/metric/ram")
def post_ram_info(item: ram):
    item.time_stamp = datetime.now(timezone.utc)
    ram_usage.append(item)
    return item

@app.get("/metric/ram")
def get_all_ram():
    return ram_usage


#### CPU #####
@app.post("/metric/cpu")
def post_cpu_info(item: cpu):
    cpu_usage.append(item)
    return item

@app.get("/metric/cpu")
def get_all_cpu():
    return cpu_usage


#### Open Ports ####
@app.post("/metric/openports")
def post_openports_info(item: ports):
    openports.append(item)
    return item

@app.get("/metric/openports")
def get_all_openports():
    return openports


#### Disk ####
@app.post("/metric/disk")
def post_disk_info(item: disk):
    disk_usage.append(item)
    return item

@app.get("/metric/disk")
def get_disk_usage():
    return disk_usage


#### Processes ####
@app.post("/metric/processes")
def post_processes_info(item: processes):
    processes_list.append(item)
    return item

@app.get("/metric/processes")
def get_all_processes():
    return processes_list


#### Connections ####
@app.post("/metric/connections")
def post_connections_info(item: connections):
    connections_list.append(item)
    return item

@app.get("/metric/connections")
def get_all_connections():
    return connections_list
