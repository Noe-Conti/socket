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
