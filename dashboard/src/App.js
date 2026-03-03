import { useState, useEffect } from "react";


function RamDisplay() {
  const [ramData, setRamData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/metric/ram")
    .then(res => res.json())
    .then(data => setRamData(data));
  }, []);

  return (
    <div>
      {ramData.map((item, index) => (
        <h2 key={index}>RAM: {item.ram_pourcentage}%</h2>
      ))}
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