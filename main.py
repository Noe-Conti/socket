from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from pymongo import MongoClient
import asyncio
import os
import uuid

MONGO_USER     = os.environ["MONGO_ROOT_USER"]
MONGO_PASSWORD = os.environ["MONGO_ROOT_PASSWORD"]

client = MongoClient(f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@mongo_db:27017/")
db = client["socketdb"]

col_ram         = db["ram"]
col_cpu         = db["cpu"]
col_openports   = db["openports"]
col_disk        = db["disk"]
col_processes   = db["processes"]
col_connections = db["connections"]
col_logs        = db["logs"]
col_alertes     = db["alertes"]
col_tickets     = db["tickets"]

# Purge automatique des logs de plus de 3 jours
col_logs.create_index("time_stamp", expireAfterSeconds=3 * 24 * 60 * 60)


def clean(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def clean_list(docs):
    return [clean(doc) for doc in docs]


SEUILS = {
    "ram":  80.0,
    "cpu":  90.0,
    "disk": 85.0,
}

#On crée une fonction séparée pour éviter de bloquer toute l'exécution de la boucle
#lors des vérifications, provoquant un passage des machines en offline
#à intervalles irréguliers
def _verifier_machine(machine: str):
    _verifier_ram(machine)
    _verifier_cpu(machine)
    _verifier_disk(machine)
    _verifier_ports(machine)
    _verifier_logs(machine)

async def surveillance_loop():
    while True:
        await asyncio.sleep(5)
        machines = await asyncio.to_thread(col_ram.distinct, "hostname")
        for machine in machines:
            await asyncio.to_thread(_verifier_machine, machine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(surveillance_loop())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

class logs(BaseModel):
    logs: list[str]
    hostname: str = None
    ip: str = None


def _alerte_active_existe(machine: str, type_: str) -> bool:
    return col_alertes.find_one({
        "machine": machine,
        "type": type_,
        "statut": "active"
    }) is not None

def _creer_alerte(machine: str, type_: str, valeur: float):
    if not _alerte_active_existe(machine, type_):
        col_alertes.insert_one({
            "id":                   str(uuid.uuid4()),
            "type":                 type_,
            "machine":              machine,
            "valeur":               valeur,
            "seuil":                SEUILS.get(type_, 0),
            "timestamp":            datetime.now(timezone.utc).isoformat(),
            "statut":               "active",
            "timestamp_resolution": None,
        })

_ports_precedents: dict = {}

def _verifier_ports(machine: str):
    doc = col_openports.find_one({"hostname": machine}, sort=[("_id", -1)])
    if not doc: return
    ports_actuels = set(doc["openports"])
    ports_avant   = _ports_precedents.get(machine)
    if ports_avant is not None:
        for port in ports_actuels - ports_avant:
            _creer_alerte(machine, f"port {port}", port)
    _ports_precedents[machine] = ports_actuels


MOTS_SUSPECTS = ["error", "fail", "denied", "unauthorized", "refused", "invalid", "attack"]

_logs_dernier_id: dict = {}

def _verifier_logs(machine: str):
    filtre = {"hostname": machine}
    dernier_id = _logs_dernier_id.get(machine)
    if dernier_id is not None:
        filtre["_id"] = {"$gt": dernier_id}

    docs = list(col_logs.find(filtre).sort("_id", 1))
    if not docs: return

    for doc in docs:
        for ligne in doc.get("logs", []):
            ligne_min = ligne.lower()
            for mot in MOTS_SUSPECTS:
                if mot in ligne_min:
                    _creer_alerte(machine, f"log suspect ({mot})", 0)
                    break

    _logs_dernier_id[machine] = docs[-1]["_id"]

def _verifier_ram(machine: str):
    doc = col_ram.find_one({"hostname": machine}, sort=[("_id", -1)])
    if not doc: return
    val = doc["ram_pourcentage"]
    if val > SEUILS["ram"]:
        _creer_alerte(machine, "ram", val)

def _verifier_cpu(machine: str):
    doc = col_cpu.find_one({"hostname": machine}, sort=[("_id", -1)])
    if not doc: return
    val = doc["cpu_pourcentage"]
    if val > SEUILS["cpu"]:
        _creer_alerte(machine, "cpu", val)

def _verifier_disk(machine: str):
    doc = col_disk.find_one({"hostname": machine}, sort=[("_id", -1)])
    if not doc: return
    val = doc["disk_pourcentage"]
    if val > SEUILS["disk"]:
        _creer_alerte(machine, "disk", val)


#### RAM ####
@app.post("/metric/ram")
def post_ram_info(item: ram):
    item.time_stamp = datetime.now(timezone.utc)
    doc = item.model_dump()
    doc["time_stamp"] = item.time_stamp.isoformat()
    col_ram.insert_one(doc)
    return item

@app.get("/metric/ram")
def get_all_ram(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_ram.find(filtre)))


#### CPU ####
@app.post("/metric/cpu")
def post_cpu_info(item: cpu):
    doc = item.model_dump()
    doc["time_stamp"] = datetime.now(timezone.utc).isoformat()
    col_cpu.insert_one(doc)
    return item

@app.get("/metric/cpu")
def get_all_cpu(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_cpu.find(filtre)))


#### Open Ports ####
@app.post("/metric/openports")
def post_openports_info(item: ports):
    doc = item.model_dump()
    doc["time_stamp"] = datetime.now(timezone.utc).isoformat()
    col_openports.insert_one(doc)
    return item

@app.get("/metric/openports")
def get_all_openports(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_openports.find(filtre)))


#### Disk ####
@app.post("/metric/disk")
def post_disk_info(item: disk):
    doc = item.model_dump()
    doc["time_stamp"] = datetime.now(timezone.utc).isoformat()
    col_disk.insert_one(doc)
    return item

@app.get("/metric/disk")
def get_disk_usage(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_disk.find(filtre)))


#### Processes ####
@app.post("/metric/processes")
def post_processes_info(item: processes):
    doc = item.model_dump()
    doc["time_stamp"] = datetime.now(timezone.utc).isoformat()
    col_processes.insert_one(doc)
    return item

@app.get("/metric/processes")
def get_all_processes(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_processes.find(filtre)))


#### Connections ####
@app.post("/metric/connections")
def post_connections_info(item: connections):
    doc = item.model_dump()
    doc["time_stamp"] = datetime.now(timezone.utc).isoformat()
    col_connections.insert_one(doc)
    return item

@app.get("/metric/connections")
def get_all_connections(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_connections.find(filtre)))


#### Logs ####
@app.post("/metric/logs")
def post_logs_info(item: logs):
    doc = item.model_dump()
    doc["time_stamp"] = datetime.now(timezone.utc)  # type Date natif requis par l'index TTL
    col_logs.insert_one(doc)
    return item

@app.get("/metric/logs")
def get_all_logs(hostname: str = None):
    filtre = {"hostname": hostname} if hostname else {}
    return clean_list(list(col_logs.find(filtre)))


#### Machines ####
@app.get("/metric/machines")
def get_machines():
    return col_ram.distinct("hostname")


#### Tickets ####
class TicketCreate(BaseModel):
    titre: str
    description: str
    ouvert_par: str
    machine: str = None

class CommentaireBody(BaseModel):
    auteur: str
    commentaire: str

class StatutBody(BaseModel):
    statut: str
    auteur: str

def _entree_historique(auteur: str, action: str) -> dict:
    return {
        "auteur": auteur,
        "action": action,
        "date":   datetime.now(timezone.utc).isoformat(),
    }

@app.post("/tickets")
def creer_ticket(body: TicketCreate):
    ticket = {
        "id":                  str(uuid.uuid4()),
        "titre":               body.titre,
        "description":         body.description,
        "ouvert_par":          body.ouvert_par,
        "origine":             "manuel",
        "alerte_id":           None,
        "machine":             body.machine,
        "timestamp_ouverture": datetime.now(timezone.utc).isoformat(),
        "statut":              "ouvert",
        "historique": [
            _entree_historique(body.ouvert_par, "Ticket ouvert")
        ],
    }
    col_tickets.insert_one(ticket)
    return clean(ticket)

@app.post("/alertes/{alerte_id}/ticket")
def creer_ticket_depuis_alerte(alerte_id: str, body: CommentaireBody):
    alerte = col_alertes.find_one({"id": alerte_id})
    if not alerte:
        return {"erreur": "Alerte introuvable"}
    ticket = {
        "id":                  str(uuid.uuid4()),
        "titre":               f"Alerte {alerte['type'].upper()} — {alerte['machine']}",
        "description":         f"Valeur détectée : {alerte['valeur']}% (seuil : {alerte['seuil']}%). {body.commentaire}",
        "ouvert_par":          "Système",
        "origine":             "automatique",
        "alerte_id":           alerte_id,
        "machine":             alerte["machine"],
        "timestamp_ouverture": datetime.now(timezone.utc).isoformat(),
        "statut":              "ouvert",
        "historique": [
            _entree_historique("Système", f"Ticket créé automatiquement depuis alerte {alerte['type'].upper()}"),
            _entree_historique(body.auteur, body.commentaire),
        ],
    }
    col_tickets.insert_one(ticket)
    return clean(ticket)

@app.get("/tickets")
def get_tickets(statut: str = None, machine: str = None):
    filtre = {}
    if statut:  filtre["statut"]  = statut
    if machine: filtre["machine"] = machine
    return clean_list(list(col_tickets.find(filtre)))

@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    ticket = col_tickets.find_one({"id": ticket_id})
    if not ticket:
        return {"erreur": "Ticket introuvable"}
    return clean(ticket)

@app.post("/tickets/{ticket_id}/statut")
def changer_statut(ticket_id: str, body: StatutBody):
    ticket = col_tickets.find_one({"id": ticket_id})
    if not ticket:
        return {"erreur": "Ticket introuvable"}
    ancien = ticket["statut"]
    entree = _entree_historique(body.auteur, f"Statut changé : {ancien} → {body.statut}")
    col_tickets.update_one(
        {"id": ticket_id},
        {"$set": {"statut": body.statut}, "$push": {"historique": entree}}
    )
    return clean(col_tickets.find_one({"id": ticket_id}))

@app.post("/tickets/{ticket_id}/commentaire")
def ajouter_commentaire(ticket_id: str, body: CommentaireBody):
    ticket = col_tickets.find_one({"id": ticket_id})
    if not ticket:
        return {"erreur": "Ticket introuvable"}
    entree = _entree_historique(body.auteur, body.commentaire)
    col_tickets.update_one(
        {"id": ticket_id},
        {"$push": {"historique": entree}}
    )
    return clean(col_tickets.find_one({"id": ticket_id}))


#### Alertes ####
@app.get("/alertes")
def get_alertes(statut: str = None):
    filtre = {"statut": statut} if statut else {}
    return clean_list(list(col_alertes.find(filtre)))

@app.post("/alertes/{alerte_id}/resoudre")
def resoudre_alerte(alerte_id: str):
    alerte = col_alertes.find_one({"id": alerte_id, "statut": "active"})
    if not alerte:
        return {"erreur": "Alerte introuvable ou déjà résolue"}
    col_alertes.update_one(
        {"id": alerte_id},
        {"$set": {
            "statut": "résolue",
            "timestamp_resolution": datetime.now(timezone.utc).isoformat()
        }}
    )
    return clean(col_alertes.find_one({"id": alerte_id}))
