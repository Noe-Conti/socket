
import "./App-style.css"
import Navbar from "./navbar.js"

import Apropos from "./pages/apropos"
import Dashboard from "./pages/dashboard"
import Parc from "./pages/parc"
import Tickets from "./pages/tickets"



export default function MyApp() {
  let Component;
  switch(window.location.pathname){
    case "/":
      Component = Dashboard
      break
    case "/apropos":
      Component = Apropos
      break
    case "/dashboard":
      Component = Dashboard
      break
    case "/parc":
      Component = Parc
      break
    case "/tickets":
      Component = Tickets
      break
    default:
      Component = Dashboard
  }
  
  
  return (
    <>
    <main>
      <header>
        {/* Barre latérale moche */}
        <Navbar />
      </header>
      
      <div className="content">

        <Component />


        
      </div>
    </main>
    </>
  );
}
  

