
// import MapComponent from "./MapComponent.jsx";
import "./App.css";
// import NewMapComponent from "./NewMapComponent.jsx";
import DotBackgroundInteractive from "./components/DotBackgroundInteractive.jsx";
import { ThemeProvider, useTheme } from "./themes/ThemeContext.jsx";

function AppContent() {
  const { theme } = useTheme();

  return (
    <div className="app-shell">
      <div className="page-background-layer">
        <DotBackgroundInteractive height="1500px" />
      </div>

      {/* <div
        className="page-content-layer"
        style={{
          background: `linear-gradient(145deg, ${theme.colors.backgroundGradientStart}CC 0%, ${theme.colors.backgroundGradientEnd}CC 100%)`,
        }}
      >
        <MapComponent />
        <NewMapComponent />
      </div> */}
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
