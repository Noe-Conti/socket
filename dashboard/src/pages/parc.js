import { useState, useEffect } from "react"
import { API_URL } from "../config"
import "./parc-style.css"


function RamDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => { //Récupère la data auprès du backend toutes les secondes 
    const fetch_ = () => fetch(API_URL + `/metric/ram?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  return (
    <div className="metric-card">
      <h3>RAM</h3>
      {/* Si data présente, afficher */}
      <p className="metric-value">{data.length > 0 ? `${data.at(-1).ram_pourcentage} %` : "—"}</p>
    </div>
  );
}

function CpuDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetch_ = () => fetch(API_URL + `/metric/cpu?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  return (
    <div className="metric-card">
      <h3>CPU</h3>
      <p className="metric-value">{data.length > 0 ? `${data.at(-1).cpu_pourcentage} %` : "—"}</p>
    </div>
  );
}

function DiskDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetch_ = () => fetch(API_URL + `/metric/disk?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  const d = data.length > 0 ? data.at(-1) : null;
  return (
    <div className="metric-card">
      <h3>Disque</h3>
      <p className="metric-value">{d ? `${d.disk_pourcentage} %` : "—"}</p>
      {d && <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#666" }}>{d.disk_used_go} Go / {d.disk_total_go} Go</p>}
    </div>
  );
}

function OpenportsDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetch_ = () => fetch(API_URL + `/metric/openports?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  const ports = data.length > 0 ? data.at(-1).openports : [];
  return (
    <div className="metric-card-list">
      <h3>Ports ouverts ({ports.length})</h3>
      <ul>{ports.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </div>
  );
}

function ProcessesDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetch_ = () => fetch(API_URL + `/metric/processes?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  const procs = data.length > 0 ? data.at(-1).processes : [];
  return (
    <div className="metric-card-list">
      <h3>Processus ({procs.length})</h3>
      <ul>{procs.map((p, i) => <li key={i}>{p}</li>)}</ul>
    </div>
  );
}

function LogsDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetch_ = () => fetch(API_URL + `/metric/logs?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  const lines = data.flatMap(d => d.logs).slice(-50);
  return (
    <div className="metric-card-list full-width">
      <h3>Logs système ({lines.length})</h3>
      <ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}

function ConnectionsDisplay({ hostname }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetch_ = () => fetch(API_URL + `/metric/connections?hostname=${hostname}`)
      .then(r => r.json()).then(setData).catch(() => setData([]));
    fetch_();
    const t = setInterval(fetch_, 1000);
    return () => clearInterval(t);
  }, [hostname]);
  const conns = data.length > 0 ? data.at(-1).connections : [];
  return (
    <div className="metric-card-list">
      <h3>Connexions actives ({conns.length})</h3>
      <ul>{conns.map((c, i) => <li key={i}>{c.remote_ip}:{c.remote_port} → :{c.local_port}</li>)}</ul>
    </div>
  );
}



//************************************ */
//Affichage des valeurs en menu
//************************************ */

export default function Parc() {

  const [machines, setMachines] = useState([]);
  const [machineStatus, setMachineStatus] = useState({}); //
  const [selectedMachine, setSelectedMachine] = useState(null); //Choix de la machine à afficher

  useEffect(() => {
    const fetchMachines = () => {
      fetch(API_URL + "/metric/machines")
        .then(res => res.json())
        .then(data => setMachines(data))
        .catch(() => setMachines([]));
    };
    fetchMachines();
    const interval = setInterval(fetchMachines, 3000);
    return () => clearInterval(interval);
  }, []);


//Vérifie toutes les secondes si agent online
  useEffect(() => {
    if (machines.length === 0) return;
    const checkAll = () => {
      machines.forEach(hostname => {
        fetch(API_URL + `/metric/ram?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => {
            if (data.length === 0) {
              setMachineStatus(prev => ({ ...prev, [hostname]: false }));
              return;
            }
            const last = new Date(data.at(-1).time_stamp);
            const ageSeconds = (Date.now() - last) / 1000;
            setMachineStatus(prev => ({ ...prev, [hostname]: ageSeconds < 10 }));
          })
          .catch(() => setMachineStatus(prev => ({ ...prev, [hostname]: false })));
      });
    };
    checkAll();
    const interval = setInterval(checkAll, 1000);
    return () => clearInterval(interval);
  }, [machines]);

// Affichage des agents et leurs statuts
  return (
    <div className="parc-layout">

      <div className="machines-list">
        <h2>Machines</h2>
        {machines.length === 0 ? <p className="no-agent">Aucun agent détecté…</p>
          : machines.map(hostname => (
            <button
              key={hostname}
              className={`machine-card${selectedMachine === hostname ? " selected" : ""}`}
              onClick={() => setSelectedMachine(hostname)}
            >
              <span>{hostname}</span>
              <span className={`status-badge ${machineStatus[hostname] ? "online" : "offline"}`}>
                {machineStatus[hostname] ? "online" : "offline"}
              </span>
            </button>
          ))
        }
      </div>
      {!selectedMachine //Affichage conditionnel de la machine selectionnée
        ? <p className="no-selection">Sélectionnez une machine pour voir ses métriques.</p>
        : (
          <div className="metrics-area">
            <h2>{selectedMachine}</h2>
            <div className="metrics-grid">
              <RamDisplay hostname={selectedMachine} />
              <CpuDisplay hostname={selectedMachine} />
              <DiskDisplay hostname={selectedMachine} />
            </div>
            <div className="metrics-grid">
              <OpenportsDisplay hostname={selectedMachine} />
              <ProcessesDisplay hostname={selectedMachine} />
              <ConnectionsDisplay hostname={selectedMachine} />
            </div>
            <div className="metrics-grid">
              <LogsDisplay hostname={selectedMachine} />
            </div>
          </div>
        )
      }

    </div>
  );
}
