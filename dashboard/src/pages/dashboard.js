import { useState, useEffect } from "react"
import { API_URL } from "../config"
import "./dashboard-style.css"

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function pct(val, total) {
  return total === 0 ? 0 : Math.round((val / total) * 100);
}

export default function Dashboard() {
  const [machines, setMachines]         = useState([]);
  const [machineStatus, setMachineStatus] = useState({});
  const [alertes, setAlertes]           = useState([]);
  const [tickets, setTickets]           = useState([]);

  // Fetch toutes les données toutes les 5s
  useEffect(() => {
    function charger() {
      fetch(API_URL + "/metric/machines").then(r => r.json()).then(setMachines).catch(() => {});
      fetch(API_URL + "/alertes").then(r => r.json()).then(setAlertes).catch(() => {});
      fetch(API_URL + "/tickets").then(r => r.json()).then(setTickets).catch(() => {});
    }
    charger();
    const t = setInterval(charger, 5000);
    return () => clearInterval(t);
  }, []);

  // Statut online par machine (même logique que parc.js)
  useEffect(() => {
    if (machines.length === 0) return;
    const checkAll = () => {
      machines.forEach(hostname => {
        fetch(API_URL + `/metric/ram?hostname=${hostname}`)
          .then(r => r.json())
          .then(data => {
            if (!data.length) { setMachineStatus(p => ({ ...p, [hostname]: false })); return; }
            const age = (Date.now() - new Date(data.at(-1).time_stamp)) / 1000;
            setMachineStatus(p => ({ ...p, [hostname]: age < 5 }));
          })
          .catch(() => setMachineStatus(p => ({ ...p, [hostname]: false })));
      });
    };
    checkAll();
    const t = setInterval(checkAll, 5000);
    return () => clearInterval(t);
  }, [machines]);

  // Stats machines
  const nbOnline  = Object.values(machineStatus).filter(Boolean).length;
  const nbOffline = machines.length - nbOnline;

  // Stats alertes
  const alertesActives  = alertes.filter(a => a.statut === "active");
  const alertesResolues = alertes.filter(a => a.statut === "résolue");
  const parType = ["ram", "cpu", "disk"].map(t => ({
    type: t,
    count: alertesActives.filter(a => a.type === t).length,
  }));
  const maxType = Math.max(...parType.map(t => t.count), 1);

  // Stats tickets
  const parStatut = ["ouvert", "en_cours", "résolu"].map(s => ({
    statut: s,
    count: tickets.filter(t => t.statut === s).length,
  }));
  const maxStatut = Math.max(...parStatut.map(s => s.count), 1);
  const ticketsOuverts = parStatut.find(s => s.statut === "ouvert")?.count ?? 0;

  // 5 dernières alertes actives
  const dernieresAlertes = [...alertesActives]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return (
    <div className="dashboard">

      {/* Ligne résumé */}
      <div className="stat-row">
        <div className="stat-card machine">
          <span className="stat-label">Machines supervisées</span>
          <span className="stat-value">{machines.length}</span>
          <span className="stat-sub">{nbOnline} en ligne · {nbOffline} hors ligne</span>
        </div>
        <div className="stat-card alerte">
          <span className="stat-label">Alertes actives</span>
          <span className="stat-value">{alertesActives.length}</span>
          <span className="stat-sub">{alertesResolues.length} résolue{alertesResolues.length !== 1 ? "s" : ""} au total</span>
        </div>
        <div className="stat-card ticket">
          <span className="stat-label">Tickets ouverts</span>
          <span className="stat-value">{ticketsOuverts}</span>
          <span className="stat-sub">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""} au total</span>
        </div>
      </div>

      {/* Ligne détail */}
      <div className="detail-row">

        <div className="detail-card">
          <h3>Tickets par statut</h3>
          <div className="breakdown">
            {parStatut.map(({ statut, count }) => (
              <div key={statut} className="breakdown-row">
                <span className="breakdown-label">{statut.replace("_", " ")}</span>
                <div className="breakdown-bar-wrap">
                  <div className={`breakdown-bar bar-${statut}`} style={{ width: `${pct(count, maxStatut)}%` }} />
                </div>
                <span className="breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-card">
          <h3>Alertes actives par type</h3>
          <div className="breakdown">
            {parType.map(({ type, count }) => (
              <div key={type} className="breakdown-row">
                <span className="breakdown-label">{type.toUpperCase()}</span>
                <div className="breakdown-bar-wrap">
                  <div className={`breakdown-bar bar-${type}`} style={{ width: `${pct(count, maxType)}%` }} />
                </div>
                <span className="breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Ligne machines + dernières alertes */}
      <div className="detail-row">

        <div className="detail-card">
          <h3>État des machines</h3>
          <div className="machines-grid">
            {machines.length === 0
              ? <p className="empty-dash">Aucune machine détectée.</p>
              : machines.map(h => (
                <div key={h} className="machine-pill">
                  <span className={`dot ${machineStatus[h] ? "online" : "offline"}`} />
                  {h}
                </div>
              ))
            }
          </div>
        </div>

        <div className="detail-card">
          <h3>Dernières alertes actives</h3>
          <div className="alertes-recentes">
            {dernieresAlertes.length === 0
              ? <p className="empty-dash">Aucune alerte active.</p>
              : dernieresAlertes.map(a => (
                <div key={a.id} className="alerte-mini">
                  <span className="type-badge">{a.type}</span>
                  <span className="mini-machine">{a.machine}</span>
                  <span className="mini-valeur">{a.valeur}% / {a.seuil}%</span>
                  <span className="mini-date">{formatDate(a.timestamp)}</span>
                </div>
              ))
            }
          </div>
        </div>

      </div>

    </div>
  );
}
