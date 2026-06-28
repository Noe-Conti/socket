# SOCket - Security Monitoring System

Tableau de bord de surveillance système en temps réel affichant l'utilisation RAM/CPU et les ports réseau ouverts.

## Architecture

```
Agent (psutil) --> Backend (FastAPI :80) --> Dashboard (React :3000)
```

- **Agent** : collecte les métriques système toutes les 3 secondes et les envoie au backend
- **Backend** : API REST qui reçoit et expose les métriques
- **Dashboard** : interface web avec rafraîchissement automatique chaque seconde

## Stack

- Python / FastAPI (backend)
- React (frontend)
- psutil (collecte des métriques)
- Docker / Docker Compose

## Lancement

```bash
docker compose up
```

| Service   | URL                      |
|-----------|--------------------------|
| Dashboard | http://localhost:3000    |
| Backend   | http://localhost:80      |
| Mongo UI  | http://localhost:8081    |

## Génération des clés et certificats

Permet la communication chiffrée et authentifiée entre les agents et le backend : 

cd certs/

### 1. Créer le CA (Autorité de Certification)
openssl genrsa -out ca.key 4096
openssl req -new -x509 -key ca.key -out ca.crt -days 365 -subj "/CN=SOCket-CA"

### 2. Créer le certificat serveur (backend)
####    Remplacer X.X.X.X par l'IP du VPS si besoin
openssl genrsa -out server.key 4096
openssl req -new -key server.key -out server.csr -subj "/CN=backend"
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out server.crt -days 365 \
  -extfile <(echo "subjectAltName=DNS:backend,DNS:localhost,IP:127.0.0.1")

### 3. Créer le certificat agent (machines supervisées)
openssl genrsa -out agent.key 4096
openssl req -new -key agent.key -out agent.csr -subj "/CN=agent"
openssl x509 -req -in agent.csr -CA ca.crt -CAkey ca.key \
  -CAcreateserial -out agent.crt -days 365

### 4. Copier server.crt/key en cert.pem/key.pem (utilisés par uvicorn)
cp server.crt cert.pem
cp server.key key.pem
