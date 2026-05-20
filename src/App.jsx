
import "./App.css";
import Navbar from "./components/Navbar.jsx";
import { Outlet } from "react-router";
import { ThemeProvider } from "./themes/ThemeContext.jsx";

function AppContent() {
  return (
    <div className="app-shell">
      <div className="page-background-layer simple-dot-background" aria-hidden="true" />

      <div className="page-navbar-layer">
        <Navbar />
      </div>

      <main className="page-content-layer">
        <Outlet />
      </main>
    </div>
  );

}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

