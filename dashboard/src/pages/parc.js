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
            </>
    
}