import { useState, useEffect } from "react"
import { API_URL } from "../config"
import "./tickets-style.css"

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}


function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [filtre, setFiltre] = useState("active");

  useEffect(() => {
    const fetch_ = () => {
      fetch(API_URL + "/alertes")
        .then(r => r.json())
        .then(setAlertes)
        .catch(() => setAlertes([]));
    };
    fetch_();
    const t = setInterval(fetch_, 5000);
    return () => clearInterval(t);
  }, []);

  function resoudre(id) {
    fetch(API_URL + `/alertes/${id}/resoudre`, { method: "POST" })
      .then(r => r.json())
      .then(() => setAlertes(prev => prev.map(a => a.id === id ? { ...a, statut: "résolue" } : a)));
  }

  function creerTicket(alerte) {
    const auteur = prompt("Votre nom :");
    if (!auteur) return;
    const commentaire = prompt("Commentaire initial :") || "Ticket créé depuis une alerte.";
    fetch(API_URL + `/alertes/${alerte.id}/ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auteur, commentaire }),
    }).then(r => r.json())
      .then(() => alert("Ticket créé avec succès."));
  }

  const affichées = alertes.filter(a => filtre === "toutes" || a.statut === filtre);

  return (
    <div>
      <div className="section-header">
        <h2>Alertes</h2>
        <div className="filtre-statut">
          {["active", "résolue", "toutes"].map(f => (
            <button key={f} className={`filtre-btn${filtre === f ? " active" : ""}`} onClick={() => setFiltre(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="alertes-list">
        {affichées.length === 0
          ? <p className="empty-msg">Aucune alerte {filtre !== "toutes" ? filtre : ""}.</p>
          : affichées.map(a => (
            <div key={a.id} className={`alerte-card ${a.statut}`}>
              <div className="alerte-info">
                <span className="type-badge">{a.type}</span>
                <div className="alerte-detail">
                  <span className="alerte-machine">{a.machine}</span>
                  <span className="alerte-valeur">{a.valeur}% — seuil : {a.seuil}%</span>
                </div>
                <span className="alerte-date">{formatDate(a.timestamp)}</span>
              </div>
              <span className={`statut-badge ${a.statut}`}>{a.statut}</span>
              {a.statut === "active" && (
                <div className="alerte-actions">
                  <button className="btn btn-ticket" onClick={() => creerTicket(a)}>+ Ticket</button>
                  <button className="btn btn-resoudre" onClick={() => resoudre(a.id)}>Résoudre</button>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}


const STATUTS = ["ouvert", "en_cours", "résolu"];

function FormulaireTicket({ onCree }) {
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", ouvert_par: "", machine: "" });

  function soumettre(e) {
    e.preventDefault();
    fetch(API_URL + "/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(ticket => { onCree(ticket); setOuvert(false); setForm({ titre: "", description: "", ouvert_par: "", machine: "" }); });
  }

  if (!ouvert) return (
    <button className="btn btn-nouveau" onClick={() => setOuvert(true)}>+ Nouveau ticket</button>
  );

  return (
    <form className="ticket-form" onSubmit={soumettre}>
      <h3>Nouveau ticket</h3>
      <input required placeholder="Titre" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
      <textarea required placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input required placeholder="Votre nom" value={form.ouvert_par} onChange={e => setForm(f => ({ ...f, ouvert_par: e.target.value }))} />
      <input placeholder="Machine concernée (optionnel)" value={form.machine} onChange={e => setForm(f => ({ ...f, machine: e.target.value }))} />
      <div className="form-actions">
        <button type="button" className="btn btn-annuler" onClick={() => setOuvert(false)}>Annuler</button>
        <button type="submit" className="btn btn-creer">Créer</button>
      </div>
    </form>
  );
}


function DetailTicket({ ticket, onRetour, onMaj }) {
  const [commentForm, setCommentForm] = useState({ auteur: "", commentaire: "" });
  const [statutForm, setStatutForm] = useState({ statut: ticket.statut, auteur: "" });

  function ajouterCommentaire(e) {
    e.preventDefault();
    fetch(API_URL + `/tickets/${ticket.id}/commentaire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commentForm),
    })
      .then(r => r.json())
      .then(t => { onMaj(t); setCommentForm({ auteur: "", commentaire: "" }); });
  }

  function changerStatut(e) {
    e.preventDefault();
    fetch(API_URL + `/tickets/${ticket.id}/statut`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statutForm),
    })
      .then(r => r.json())
      .then(t => { onMaj(t); setStatutForm(f => ({ ...f, auteur: "" })); });
  }

  return (
    <div className="detail-layout">

      <button className="btn-retour" onClick={onRetour}>← Retour</button>

      <div className="detail-header">
        <div className="ticket-top">
          <span className={`ticket-statut-badge ${ticket.statut}`}>{ticket.statut.replace("_", " ")}</span>
          {ticket.origine === "automatique" && <span className="origine-badge">Auto</span>}
          {ticket.machine && <span className="ticket-machine">{ticket.machine}</span>}
          <span className="alerte-date">{formatDate(ticket.timestamp_ouverture)}</span>
        </div>
        <h2 className="detail-titre">{ticket.titre}</h2>
        <p className="ticket-meta">Ouvert par <strong>{ticket.ouvert_par}</strong></p>
        <p className="detail-description">{ticket.description}</p>
      </div>

      <div className="detail-colonnes">

        {/* Historique */}
        <div className="detail-section">
          <h3>Historique</h3>
          <div className="historique">
            {ticket.historique.map((e, i) => (
              <div key={i} className="historique-entree">
                <div className="historique-meta">
                  <strong>{e.auteur}</strong>
                  <span className="alerte-date">{formatDate(e.date)}</span>
                </div>
                <p className="historique-action">{e.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="detail-section">

          <h3>Ajouter un commentaire</h3>
          <form className="action-form" onSubmit={ajouterCommentaire}>
            <input required placeholder="Votre nom" value={commentForm.auteur}
              onChange={e => setCommentForm(f => ({ ...f, auteur: e.target.value }))} />
            <textarea required placeholder="Commentaire" value={commentForm.commentaire}
              onChange={e => setCommentForm(f => ({ ...f, commentaire: e.target.value }))} />
            <button type="submit" className="btn btn-creer">Ajouter</button>
          </form>

          <h3 style={{ marginTop: "20px" }}>Changer le statut</h3>
          <form className="action-form" onSubmit={changerStatut}>
            <select value={statutForm.statut}
              onChange={e => setStatutForm(f => ({ ...f, statut: e.target.value }))}>
              {STATUTS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
            <input required placeholder="Votre nom" value={statutForm.auteur}
              onChange={e => setStatutForm(f => ({ ...f, auteur: e.target.value }))} />
            <button type="submit" className="btn btn-creer">Appliquer</button>
          </form>

        </div>
      </div>
    </div>
  );
}


function ListeTickets() {
  const [tickets, setTickets] = useState([]);
  const [filtre, setFiltre] = useState("ouvert");
  const [selected, setSelected] = useState(null);

  function charger() {
    fetch(API_URL + "/tickets")
      .then(r => r.json())
      .then(setTickets)
      .catch(() => setTickets([]));
  }

  useEffect(() => { charger(); }, []);

  function onMaj(ticketMaj) {
    setTickets(prev => prev.map(t => t.id === ticketMaj.id ? ticketMaj : t));
    setSelected(ticketMaj);
  }

  if (selected) return (
    <DetailTicket ticket={selected} onRetour={() => setSelected(null)} onMaj={onMaj} />
  );

  const affichés = tickets.filter(t => filtre === "tous" || t.statut === filtre);

  return (
    <div>
      <div className="section-header">
        <h2>Tickets</h2>
        <div className="filtre-statut">
          {["ouvert", "en_cours", "résolu", "tous"].map(f => (
            <button key={f} className={`filtre-btn${filtre === f ? " active" : ""}`} onClick={() => setFiltre(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <FormulaireTicket onCree={t => setTickets(prev => [t, ...prev])} />

      <div className="tickets-list">
        {affichés.length === 0
          ? <p className="empty-msg">Aucun ticket {filtre !== "tous" ? filtre.replace("_", " ") : ""}.</p>
          : affichés.map(t => (
            <div key={t.id} className={`ticket-card statut-${t.statut}`} onClick={() => setSelected(t)}>
              <div className="ticket-top">
                <span className={`ticket-statut-badge ${t.statut}`}>{t.statut.replace("_", " ")}</span>
                {t.origine === "automatique" && <span className="origine-badge">Auto</span>}
                {t.machine && <span className="ticket-machine">{t.machine}</span>}
                <span className="alerte-date">{formatDate(t.timestamp_ouverture)}</span>
              </div>
              <p className="ticket-titre">{t.titre}</p>
              <p className="ticket-meta">Ouvert par <strong>{t.ouvert_par}</strong> · {t.historique.length} entrée{t.historique.length > 1 ? "s" : ""}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}


export default function Tickets() {
  const [onglet, setOnglet] = useState("tickets");

  return (
    <div className="tickets-layout">
      <div className="tabs">
        <button className={`tab${onglet === "alertes" ? " active" : ""}`} onClick={() => setOnglet("alertes")}>
          Alertes
        </button>
        <button className={`tab${onglet === "tickets" ? " active" : ""}`} onClick={() => setOnglet("tickets")}>
          Tickets
        </button>
      </div>

      {onglet === "alertes" && <Alertes />}
      {onglet === "tickets" && <ListeTickets />}
    </div>
  );
}
