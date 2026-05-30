from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000"
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

class cpu(BaseModel):
    cpu_pourcentage: float

class ports(BaseModel):
    openports: list[int]



ram_usage = []
cpu_usage = []
openports = []



#### RAM #####
@app.post("/metric/ram")
def post_ram_info(item: ram):
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


#### Open Ports ####
@app.post("/metric/openports")
def post_openports_info(item: ports):
    openports.append(item)
    return item

@app.get("/metric/openports")
def get_all_openports():
    return openports