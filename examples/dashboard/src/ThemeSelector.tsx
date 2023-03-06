import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export const isThemeType = (value: string | undefined | null): value is Theme =>
  value === "dark" || value === "white";

export const getLastSelectedTheme = (): Theme => {
  const theme = localStorage.getItem("theme");
  return isThemeType(theme) ? theme : "light";
};

export const ThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    getLastSelectedTheme()
  );

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("theme", theme);
  };

  useEffect(() => {
    const html = document.getElementsByTagName("html")?.[0];
    if (!html) return;
    html.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  return (
    <button
      className="btn btn-sm mb-0"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
    >
      Toggle theme
    </button>
  );
};
