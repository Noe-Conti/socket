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

export default function MyApp() {
  return (
    <div>
      <h1>SOCKet</h1>
      <RamDisplay />
    </div>
  );
}

