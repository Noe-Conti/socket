import { useState, useEffect } from "react";


function RamDisplay() {
  const [ramData, setRamData] = useState([]);

  useEffect(() => {
    const fetchRam = () => {
      fetch("http://localhost:8080/metric/ram")
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
        <h2>RAM: {ramData.at(-1).ram_pourcentage}%</h2>
      )}
    </div>


  );
}


function CpuDisplay() {
  const [cpuData, setCpuData] = useState([]);

  useEffect(() => {
    const fetchCpu = () => {
      fetch("http://localhost:8080/metric/cpu")
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
        <h2>CPU: {cpuData.at(-1).cpu_pourcentage}%</h2>
      )}
    </div>
  );
}




function OpenportsDisplay() {
  const [openportsData, setOpenportsData] = useState([]);

  useEffect(() => {
    const fetchOpenports = () => {
      fetch("http://localhost:8080/metric/openports")
      .then(res => res.json())
      .then(data => setOpenportsData(data));
    }

    fetchOpenports();
    const interval = setInterval(fetchOpenports, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {openportsData.length > 0 &&(
        <h2>Open ports: {openportsData.at(-1).openports.join(", ")}</h2>
      )}
    </div>
  );
}


export default function MyApp() {
  return (
    <div>
      <h1>SOCKet</h1>
      <RamDisplay />
      <CpuDisplay />
      <OpenportsDisplay />
    </div>
  );
}

