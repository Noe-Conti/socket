from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import asyncio
import uuid

SEUILS = {
    "ram":  80.0,
    "cpu":  90.0,
    "disk": 85.0,
}

async def surveillance_loop():
    while True:
        await asyncio.sleep(5)
        for machine in list(known_machines):
            _verifier_ram(machine)
            _verifier_cpu(machine)
            _verifier_disk(machine)
            _verifier_ports(machine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(surveillance_loop())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000"
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

known_machines = set()

alertes: list = []


def _alerte_active_existe(machine: str, type_: str) -> bool:
    return any(a["machine"] == machine and a["type"] == type_ and a["statut"] == "active" for a in alertes)

def _creer_alerte(machine: str, type_: str, valeur: float):
    if not _alerte_active_existe(machine, type_):
        alertes.append({
            "id":                   str(uuid.uuid4()),
            "type":                 type_,
            "machine":              machine,
            "valeur":               valeur,
            "seuil":                SEUILS[type_],
            "timestamp":            datetime.now(timezone.utc).isoformat(),
            "statut":               "active",
            "timestamp_resolution": None,
        })

_ports_precedents: dict = {}

def _verifier_ports(machine: str):
    données = [r for r in openports if r.hostname == machine]
    if not données: return
    ports_actuels = set(données[-1].openports)
    ports_avant   = _ports_precedents.get(machine)
    if ports_avant is not None:
        for port in ports_actuels - ports_avant:
            _creer_alerte(machine, f"port {port}", port)
    _ports_precedents[machine] = ports_actuels

def _verifier_ram(machine: str):
    données = [r for r in ram_usage if r.hostname == machine]
    if not données: return
    val = données[-1].ram_pourcentage
    if val > SEUILS["ram"]:
        _creer_alerte(machine, "ram", val)

def _verifier_cpu(machine: str):
    données = [r for r in cpu_usage if r.hostname == machine]
    if not données: return
    val = données[-1].cpu_pourcentage
    if val > SEUILS["cpu"]:
        _creer_alerte(machine, "cpu", val)

def _verifier_disk(machine: str):
    données = [r for r in disk_usage if r.hostname == machine]
    if not données: return
    val = données[-1].disk_pourcentage
    if val > SEUILS["disk"]:
        _creer_alerte(machine, "disk", val)


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
    statut: str   # "ouvert", "en_cours", "résolu"
    auteur: str


tickets: list = []


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
    tickets.append(ticket)
    return ticket


@app.post("/alertes/{alerte_id}/ticket")
def creer_ticket_depuis_alerte(alerte_id: str, body: CommentaireBody):
    alerte = next((a for a in alertes if a["id"] == alerte_id), None)
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
    tickets.append(ticket)
    return ticket


@app.get("/tickets")
def get_tickets(statut: str = None, machine: str = None):
    result = tickets
    if statut:
        result = [t for t in result if t["statut"] == statut]
    if machine:
        result = [t for t in result if t["machine"] == machine]
    return result


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    if not ticket:
        return {"erreur": "Ticket introuvable"}
    return ticket


@app.post("/tickets/{ticket_id}/statut")
def changer_statut(ticket_id: str, body: StatutBody):
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    if not ticket:
        return {"erreur": "Ticket introuvable"}
    ancien = ticket["statut"]
    ticket["statut"] = body.statut
    ticket["historique"].append(
        _entree_historique(body.auteur, f"Statut changé : {ancien} → {body.statut}")
    )
    return ticket


@app.post("/tickets/{ticket_id}/commentaire")
def ajouter_commentaire(ticket_id: str, body: CommentaireBody):
    ticket = next((t for t in tickets if t["id"] == ticket_id), None)
    if not ticket:
        return {"erreur": "Ticket introuvable"}
    ticket["historique"].append(
        _entree_historique(body.auteur, body.commentaire)
    )
    return ticket


#### Alertes ####
@app.get("/alertes")
def get_alertes(statut: str = None):
    if statut:
        return [a for a in alertes if a["statut"] == statut]
    return alertes

@app.post("/alertes/{alerte_id}/resoudre")
def resoudre_alerte(alerte_id: str):
    for a in alertes:
        if a["id"] == alerte_id and a["statut"] == "active":
            a["statut"] = "résolue"
            a["timestamp_resolution"] = datetime.now(timezone.utc).isoformat()
            return a
    return {"erreur": "Alerte introuvable ou déjà résolue"}
