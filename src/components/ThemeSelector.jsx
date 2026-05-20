// import { useTheme } from "../themes/ThemeContext.jsx";
// import "../styles/ThemeSelector.css";

// export default function ThemeSelector() {
//   const { currentTheme, switchTheme, colorThemes } = useTheme();
//   const themeNames = Object.keys(colorThemes);

//   return (
//     <div className="theme-selector-container">
//       <div className="theme-selector-header">
//         <h2>🎨 Map Theme</h2>
//         <p>Choose your preferred color scheme</p>
//       </div>

//       <div className="theme-buttons-grid">
//         {themeNames.map((themeName) => {
//           const theme = colorThemes[themeName];
//           const isActive = currentTheme === themeName;

//           return (
//             <button
//               key={themeName}
//               className={`theme-button ${isActive ? "active" : ""}`}
//               onClick={() => switchTheme(themeName)}
//               title={`Switch to ${theme.name} theme`}
//             >
//               <div className="theme-preview">
//                 <div
//                   className="color-dot primary"
//                   style={{ backgroundColor: theme.colors.primary }}
//                 />
//                 <div
//                   className="color-dot secondary"
//                   style={{ backgroundColor: theme.colors.secondary }}
//                 />
//                 <div
//                   className="color-dot accent"
//                   style={{ backgroundColor: theme.colors.primaryHover }}
//                 />
//               </div>
//               <span className="theme-name">{theme.name}</span>
//               {isActive && <div className="active-indicator">✓</div>}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
