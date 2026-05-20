import { createContext, useState, useContext } from "react";
import { colorThemes, getTheme } from "./colorThemes";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState("forest");

  const switchTheme = (themeName) => {
    if (colorThemes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const theme = getTheme(currentTheme);

  return (
    <ThemeContext.Provider value={{ currentTheme, switchTheme, theme, colorThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
