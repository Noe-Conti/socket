export default function Navbar() {
    return <nav className="nav">
        <h1 className="title">SOCKET Endpoint & Network Supervision Platform</h1>
        <div className="linkContainer">
            <ul>
                <a href="/dashboard"><li>Dashboard</li></a>
                <a href="/parc"><li>Parc Informatique</li></a>
                <a href="/tickets"><li>Tickets</li></a>
                <a href="/apropos"><li>A propos</li></a>
            </ul>
        </div>
    </nav>
}
