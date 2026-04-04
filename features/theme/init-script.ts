import { themeStorageKey, type ThemePreference } from "@/features/theme/types";

type ThemeInitScriptOptions = {
  defaultTheme?: ThemePreference;
  enableSystem?: boolean;
  storageKey?: string;
};

export function getThemeInitScript({
  defaultTheme = "system",
  enableSystem = true,
  storageKey = themeStorageKey,
}: ThemeInitScriptOptions = {}) {
  return `(function(){try{var storageKey=${JSON.stringify(storageKey)};var defaultTheme=${JSON.stringify(defaultTheme)};var enableSystem=${JSON.stringify(enableSystem)};var storedTheme=localStorage.getItem(storageKey);var theme=storedTheme==="light"||storedTheme==="dark"||storedTheme==="system"?storedTheme:defaultTheme;var resolvedTheme=theme==="dark"?"dark":theme==="system"&&enableSystem&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var root=document.documentElement;root.classList.toggle("dark",resolvedTheme==="dark");root.style.colorScheme=resolvedTheme;}catch(e){}})();`;
}
