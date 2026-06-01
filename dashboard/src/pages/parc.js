import { useState, useEffect } from "react"
export default function Parc(){


  //Si dernier enregistrement de l'agent < 5s, agent online. Sinon, agent offline
    const [agentOnline, setAgentOnline] = useState(null); // null = en cours de vérification
    useEffect(() => {
      const checkAgent = () => {
        fetch("http://localhost:80/metric/ram")
          .then(res => res.json())
          .then(data => {
            if (data.length === 0) {setAgentOnline(false); return; } //Si aucune data, offline bien sûr
            const last = new Date(data.at(-1).time_stamp);
            const age = (Date.now() - last) / 1000;
            setAgentOnline(age < 5);
          })
          .catch((err) => {
            setAgentOnline(false);
            console.log("erreur:", err);
          })
      };

      checkAgent();
      const interval = setInterval(checkAgent, 1000);
      return () => clearInterval(interval);
    }, []);


    function RamDisplay() {
      const [ramData, setRamData] = useState([]);

      useEffect(() => {
        const fetchRam = () => {
          fetch("http://localhost:80/metric/ram")
          .then(res => res.json())
          .then(data => setRamData(data))
          .catch(() => setRamData([]));
        }

        fetchRam();
        const interval = setInterval(fetchRam, 1000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div>
          {ramData.length > 0 &&(
            <h3>{ramData.at(-1).ram_pourcentage}%</h3>
          )}
        </div>
      );
    }


  function CpuDisplay() {
      const [cpuData, setCpuData] = useState([]);

      useEffect(() => {
        const fetchCpu = () => {
          fetch("http://localhost:80/metric/cpu")
          .then(res => res.json())
          .then(data => setCpuData(data))
          .catch(() => setCpuData([]));
        }

        fetchCpu();
        const interval = setInterval(fetchCpu, 1000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div>
          {cpuData.length > 0 &&(
            <h3>{cpuData.at(-1).cpu_pourcentage}%</h3>
          )}
        </div>
      );
    }


  function DiskUsage() {
      const [diskData, setDiskData] = useState([]);

      useEffect(() => {
        const fetchDisk = () => {
          fetch("http://localhost:80/metric/disk")
          .then(res => res.json())
          .then(data => setDiskData(data))
          .catch(() => setDiskData([]));
        }

        fetchDisk();
        const interval = setInterval(fetchDisk, 1000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div>
          {diskData.length > 0 &&(
            <h3>{diskData.at(-1).disk_pourcentage}% ({diskData.at(-1).disk_used_go} Go / {diskData.at(-1).disk_total_go} Go)</h3>
          )}
        </div>
      );
    }


    function OpenportsDisplay() {
      const [openportsData, setOpenportsData] = useState([]);

      useEffect(() => {
        const fetchOpenports = () => {
          fetch("http://localhost:80/metric/openports")
          .then(res => res.json())
          .then(data => setOpenportsData(data))
          .catch(() => setOpenportsData([]));
        }

        fetchOpenports();
        const interval = setInterval(fetchOpenports, 1000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div>
          {openportsData.length > 0 &&
            openportsData.at(-1).openports.map((port, index) => (
              <p key={index}>{port}</p>
            )
          )}
        </div>
      );
    }


    function ProcessesDisplay() {
      const [processesData, setProcessesData] = useState([]);

      useEffect(() => {
        const fetchProcesses = () => {
          fetch("http://localhost:80/metric/processes")
          .then(res => res.json())
          .then(data => setProcessesData(data))
          .catch(() => setProcessesData([]));
        }

        fetchProcesses();
        const interval = setInterval(fetchProcesses, 1000);

        return () => clearInterval(interval);
      }, []);

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


    function ConnectionsDisplay() {
      const [connectionsData, setConnectionsData] = useState([]);

      useEffect(() => {
        const fetchConnections = () => {
          fetch("http://localhost:80/metric/connections")
          .then(res => res.json())
          .then(data => setConnectionsData(data))
          .catch(() => setConnectionsData([]));
        }

        fetchConnections();
        const interval = setInterval(fetchConnections, 1000);

        return () => clearInterval(interval);
      }, []);

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



          if (agentOnline === null) return <h1>Connection en cours...</h1>;

          if (agentOnline === false) return <h1>Agent injoignable</h1>;

          if (agentOnline === true)
            return<> <div class="left-metrics">
              <div class="ram metric">
            <h2>Utilisation de la RAM (%)</h2>
            <p><RamDisplay /></p>
            </div>
            <div class="cpu metric">
            <h2>Utilisation CPU (%)</h2>
            <CpuDisplay />
            </div>

            </div>
            <div class="ports metric">
            <h2>Affichage des ports ouverts</h2>
            <OpenportsDisplay />
            </div>

            <div class="Disk">
            <h2>Affichage de l'utilisation du disque</h2>
            <DiskUsage />
            </div>

            <div class="processes metric">
            <h2>Processus en cours</h2>
            <ProcessesDisplay />
            </div>

            <div class="connections metric">
            <h2>Connexions actives</h2>
            <ConnectionsDisplay />
            </div>



            </>



}
