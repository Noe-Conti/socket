import { useState, useEffect } from "react"

export default function Parc() {

  const [machines, setMachines] = useState([]);
  const [machineStatus, setMachineStatus] = useState({});
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Récupère la liste des machines connues toutes les 3s
  useEffect(() => {
    const fetchMachines = () => {
      fetch("http://localhost:80/metric/machines")
        .then(res => res.json())
        .then(data => setMachines(data))
        .catch(() => setMachines([]));
    };
    fetchMachines();
    const interval = setInterval(fetchMachines, 3000);
    return () => clearInterval(interval);
  }, []);

  // Pour chaque machine connue, vérifie si son dernier envoi RAM date de moins de 5s
  useEffect(() => {
    if (machines.length === 0) return;

    const checkAll = () => {
      machines.forEach(hostname => {
        fetch(`http://localhost:80/metric/ram?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => {
            if (data.length === 0) {
              setMachineStatus(prev => ({ ...prev, [hostname]: false }));
              return;
            }
            const last = new Date(data.at(-1).time_stamp);
            const ageSeconds = (Date.now() - last) / 1000;
            setMachineStatus(prev => ({ ...prev, [hostname]: ageSeconds < 5 }));
          })
          .catch(() => setMachineStatus(prev => ({ ...prev, [hostname]: false })));
      });
    };

    checkAll();
    const interval = setInterval(checkAll, 1000);
    return () => clearInterval(interval);
  }, [machines]);


  // Composants d'affichage — chacun accepte un hostname pour filtrer ses requêtes

  function RamDisplay({ hostname }) {
    const [ramData, setRamData] = useState([]);
    useEffect(() => {
      const fetch_ = () => {
        fetch(`http://localhost:80/metric/ram?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => setRamData(data))
          .catch(() => setRamData([]));
      };
      fetch_();
      const interval = setInterval(fetch_, 1000);
      return () => clearInterval(interval);
    }, [hostname]);

    return (
      <div>
        {ramData.length > 0 && <h3>{ramData.at(-1).ram_pourcentage}%</h3>}
      </div>
    );
  }

  function CpuDisplay({ hostname }) {
    const [cpuData, setCpuData] = useState([]);
    useEffect(() => {
      const fetch_ = () => {
        fetch(`http://localhost:80/metric/cpu?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => setCpuData(data))
          .catch(() => setCpuData([]));
      };
      fetch_();
      const interval = setInterval(fetch_, 1000);
      return () => clearInterval(interval);
    }, [hostname]);

    return (
      <div>
        {cpuData.length > 0 && <h3>{cpuData.at(-1).cpu_pourcentage}%</h3>}
      </div>
    );
  }

  function DiskUsage({ hostname }) {
    const [diskData, setDiskData] = useState([]);
    useEffect(() => {
      const fetch_ = () => {
        fetch(`http://localhost:80/metric/disk?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => setDiskData(data))
          .catch(() => setDiskData([]));
      };
      fetch_();
      const interval = setInterval(fetch_, 1000);
      return () => clearInterval(interval);
    }, [hostname]);

    return (
      <div>
        {diskData.length > 0 && (
          <h3>{diskData.at(-1).disk_pourcentage}% ({diskData.at(-1).disk_used_go} Go / {diskData.at(-1).disk_total_go} Go)</h3>
        )}
      </div>
    );
  }

  function OpenportsDisplay({ hostname }) {
    const [openportsData, setOpenportsData] = useState([]);
    useEffect(() => {
      const fetch_ = () => {
        fetch(`http://localhost:80/metric/openports?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => setOpenportsData(data))
          .catch(() => setOpenportsData([]));
      };
      fetch_();
      const interval = setInterval(fetch_, 1000);
      return () => clearInterval(interval);
    }, [hostname]);

    return (
      <div>
        {openportsData.length > 0 &&
          openportsData.at(-1).openports.map((port, index) => (
            <p key={index}>{port}</p>
          ))
        }
      </div>
    );
  }

  function ProcessesDisplay({ hostname }) {
    const [processesData, setProcessesData] = useState([]);
    useEffect(() => {
      const fetch_ = () => {
        fetch(`http://localhost:80/metric/processes?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => setProcessesData(data))
          .catch(() => setProcessesData([]));
      };
      fetch_();
      const interval = setInterval(fetch_, 1000);
      return () => clearInterval(interval);
    }, [hostname]);

    return (
      <div>
        {processesData.length > 0 &&
          processesData.at(-1).processes.map((proc, index) => (
            <p key={index}>{proc}</p>
          ))
        }
      </div>
    );
  }

  function ConnectionsDisplay({ hostname }) {
    const [connectionsData, setConnectionsData] = useState([]);
    useEffect(() => {
      const fetch_ = () => {
        fetch(`http://localhost:80/metric/connections?hostname=${hostname}`)
          .then(res => res.json())
          .then(data => setConnectionsData(data))
          .catch(() => setConnectionsData([]));
      };
      fetch_();
      const interval = setInterval(fetch_, 1000);
      return () => clearInterval(interval);
    }, [hostname]);

    return (
      <div>
        {connectionsData.length > 0 &&
          connectionsData.at(-1).connections.map((conn, index) => (
            <p key={index}>{conn.remote_ip}:{conn.remote_port} → port local {conn.local_port}</p>
          ))
        }
      </div>
    );
  }


  return (
    <>
      {/* Liste des machines avec badge online/offline */}
      <div className="machines-list">
        {machines.length === 0 && <p>Aucun agent détecté...</p>}
        {machines.map(hostname => (
          <button
            key={hostname}
            onClick={() => setSelectedMachine(hostname)}
            style={{ fontWeight: selectedMachine === hostname ? "bold" : "normal" }}
          >
            {hostname} {machineStatus[hostname] ? "● online" : "○ offline"}
          </button>
        ))}
      </div>

      {/* Métriques de la machine sélectionnée */}
      {selectedMachine && (
        <>
          <h2>{selectedMachine}</h2>

          <div className="left-metrics">
            <div className="ram metric">
              <h2>Utilisation de la RAM (%)</h2>
              <RamDisplay hostname={selectedMachine} />
            </div>
            <div className="cpu metric">
              <h2>Utilisation CPU (%)</h2>
              <CpuDisplay hostname={selectedMachine} />
            </div>
          </div>

          <div className="ports metric">
            <h2>Affichage des ports ouverts</h2>
            <OpenportsDisplay hostname={selectedMachine} />
          </div>

          <div className="Disk">
            <h2>Affichage de l'utilisation du disque</h2>
            <DiskUsage hostname={selectedMachine} />
          </div>

          <div className="processes metric">
            <h2>Processus en cours</h2>
            <ProcessesDisplay hostname={selectedMachine} />
          </div>

          <div className="connections metric">
            <h2>Connexions actives</h2>
            <ConnectionsDisplay hostname={selectedMachine} />
          </div>
        </>
      )}
    </>
  );
}
