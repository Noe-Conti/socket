from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os
import datetime


# MongoDB setup: use MONGODB_URI env var so it works in docker-compose
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://admin:password@mongo_db:27017")
MONGODB_DBNAME = os.getenv("MONGODB_DBNAME", "machines_history")

# MongoDB setup
try:
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DBNAME]
    ram_col = db["ram"]
    cpu_col = db["cpu"]
    openports_col = db["openports"]
        # create indexes for faster queries by hostname, ip and timestamp
    try:
        ram_col.create_index([("hostname", 1), ("ip", 1), ("timestamp", -1)])
        cpu_col.create_index([("hostname", 1), ("ip", 1), ("timestamp", -1)])
        openports_col.create_index([("hostname", 1), ("ip", 1), ("timestamp", -1)])
    except Exception:
        pass
except Exception:
    # If MongoDB isn't available, collections will be None and code will still work with in-memory lists
    client = None
    ram_col = None
    cpu_col = None
    openports_col = None

app = FastAPI()

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ram(BaseModel):
    hostname: str
    ip: str
    ram_pourcentage: float

class cpu(BaseModel):
    hostname: str
    ip: str
    cpu_pourcentage: float

class ports(BaseModel):
    hostname: str
    ip: str
    openports: list[int]



ram_usage = []
cpu_usage = []
openports = []



#### RAM #####
@app.post("/metric/ram")
def post_ram_info(item: ram):
    data = item.dict()
    data["timestamp"] = datetime.datetime.utcnow()
    if ram_col is not None:
        res = ram_col.insert_one(data)
        data["id"] = str(res.inserted_id)
    else:
        ram_usage.append(data)
    return data
    

@app.get("/metric/ram")
def get_all_ram():
    if ram_col is not None:
        docs = []
        for d in ram_col.find():
            d["id"] = str(d.pop("_id"))
            docs.append(d)
        return docs
    return ram_usage


#### CPU #####
@app.post("/metric/cpu")
def post_cpu_info(item: cpu):
    data = item.dict()
    data["timestamp"] = datetime.datetime.utcnow()
    if cpu_col is not None:
        res = cpu_col.insert_one(data)
        data["id"] = str(res.inserted_id)
    else:
        cpu_usage.append(data)
    return data

@app.get("/metric/cpu")
def get_all_cpu():
    if cpu_col is not None:
        docs = []
        for d in cpu_col.find():
            d["id"] = str(d.pop("_id"))
            docs.append(d)
        return docs
    return cpu_usage


#### Open Ports ####
@app.post("/metric/openports")
def post_openports_info(item: ports):
    data = item.dict()
    data["timestamp"] = datetime.datetime.utcnow()
    if openports_col is not None:
        res = openports_col.insert_one(data)
        data["id"] = str(res.inserted_id)
    else:
        openports.append(data)
    return data

@app.get("/metric/openports")
def get_all_openports():
    if openports_col is not None:
        docs = []
        for d in openports_col.find():
            d["id"] = str(d.pop("_id"))
            docs.append(d)
        return docs
    return openports