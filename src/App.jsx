
// import MapComponent from "./MapComponent.jsx";
import "./App.css";
import NewMapComponent from "./NewMapComponent.jsx";
import { ThemeProvider, useTheme } from "./themes/ThemeContext.jsx";

function AppContent() {
  const { theme } = useTheme();

  return (
    <div
      className="app-shell"
      style={{
        background: `linear-gradient(145deg, ${theme.colors.backgroundGradientStart} 0%, ${theme.colors.backgroundGradientEnd} 100%)`,
      }}
    >
      {/* <MapComponent /> */}
      <NewMapComponent />
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
