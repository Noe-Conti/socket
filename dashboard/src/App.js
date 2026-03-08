import { useState, useEffect } from "react";
import "./App-style.css"


function RamDisplay() {
  const [ramData, setRamData] = useState([]);

  useEffect(() => {
    const fetchRam = () => {
      fetch("http://localhost:80/metric/ram")
      .then(res => res.json())
      .then(data => setRamData(data));
    }

    
    fetchRam();
    const interval = setInterval(fetchRam, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    // <div>
    //   {ramData.map((item, index) => (
    //     <h2 key={index}>RAM: {item.ram_pourcentage}%</h2>
    //   ))}
    // </div>

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
      .then(data => setCpuData(data));
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
      .then(data => setOpenportsData(data));
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


export default function MyApp() {
  return (
    <>
    <header>
      <h1>SOCKet Security Monitoring System</h1>
    </header>
    <main>
      <div class="metric-container">
        <div class="left-metrics">
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
      </div>
    </main>
    </>
  );
}

