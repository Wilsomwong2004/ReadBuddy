import React, { useEffect, useState } from "react";
import { loadDarkMode, saveDarkMode, applyDarkMode } from "./darkMode";

export default function InterfaceThemeSelect({ handleSettingChange }) {
  const [theme, setTheme] = useState("false");

  useEffect(() => {
    loadDarkMode((isDark) => {
      const newTheme = isDark ? "true" : "false";
      setTheme(newTheme);
      handleSettingChange("theme", newTheme);
    });

    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "darkModeChanged") {
          const newTheme = message.darkMode ? "true" : "false";
          setTheme(newTheme);
          handleSettingChange("theme", newTheme);
          applyDarkMode(message.darkMode);
        }
      });
    }
  }, []);

  const handleThemeChange = (e) => {
    const newValue = e.target.value;
    setTheme(newValue);
    handleSettingChange("theme", newValue);

    const isDark = newValue === "true";
    applyDarkMode(isDark);
    saveDarkMode(isDark);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Interface theme
      </label>
      <select
        value={theme}
        onChange={handleThemeChange}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="false">Light</option>
        <option value="true">Dark</option>
      </select>
    </div>
  );
}
