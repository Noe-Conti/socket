export default function Apropos() {
  return (
    <div style={{ maxWidth: "600px", lineHeight: "1.7" }}>
      <h1>À propos</h1>

      <p>
        <strong>SOCket</strong> est une plateforme de supervision d'endpoints et de réseau.
        Elle permet de surveiller en temps réel l'état des machines d'un parc informatique,
        de détecter des anomalies et de gérer les incidents via un système de ticketing intégré.
      </p>

      <h2>Fonctionnalités</h2>
      <ul>
        <li>Supervision en temps réel : RAM, CPU, disque, ports ouverts, processus, connexions réseau</li>
        <li>Détection automatique des machines via agents déployés sur chaque poste</li>
        <li>Génération automatique d'alertes en cas de dépassement de seuil</li>
        <li>Système de ticketing : création manuelle ou automatique depuis une alerte</li>
        <li>Suivi des résolutions avec historique horodaté</li>
      </ul>

      <h2>Architecture</h2>
      <ul>
        <li><strong>Agent</strong> — script Python embarqué sur chaque machine supervisée, envoie les métriques toutes les 3 secondes</li>
        <li><strong>Backend</strong> — API REST FastAPI, détection des alertes en tâche de fond</li>
        <li><strong>Frontend</strong> — interface React (cette application)</li>
        <li><strong>Base de données</strong> — MongoDB</li>
      </ul>

      <h2>Projet</h2>
      <p>
        Développé dans le cadre d'un projet scolaire. Stack : Python · FastAPI · React · MongoDB · Docker.
      </p>
    </div>
  );
}