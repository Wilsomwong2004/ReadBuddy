import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { loadDarkMode, saveDarkMode, applyDarkMode } from './utils/darkMode';
import { BookOpen, Clock, Star, Settings, Menu, X, Bookmark, Save, RotateCcw, Download, BookText, Bug, Lightbulb, Shield } from 'lucide-react';

const ReadBuddySettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [os, setOS] = useState("unknown");
  const [settings, setSettings] = useState({
    autoProcess: true,
    defaultAction: 'summarize',
    language: 'en',
    theme: '',
    shortcuts: {
      summarize: '',
      translate: '',
      explain: '',
      chat: ''
    }
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode') || 'false';
    const isDark = savedTheme === 'true';
    setIsDarkMode(isDark);
    setSettings(prev => ({
      ...prev,
      theme: savedTheme
    }));
  }, []);

  useEffect(() => {
    function getOS() {
      const userAgent = window.navigator.userAgent,
          platform = window.navigator?.userAgentData?.platform || window.navigator.platform,
          macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
          windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
          iosPlatforms = ['iPhone', 'iPad', 'iPod'];
      let os = null;

      if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
      } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
      } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
      } else if (/Android/.test(userAgent)) {
        os = 'Android';
      } else if (/Linux/.test(platform)) {
        os = 'Linux';
      } else {
        os = 'Unknown OS';
      }

      return os;
    }
    const detectedOS = getOS();
    setOS(detectedOS);
    console.log("Detected OS:", detectedOS);
  }, []);

  useEffect(() => {
    if (chrome?.commands) {
      chrome.commands.getAll((commands) => {
        const updatedShortcuts = { ...settings.shortcuts };

        commands.forEach((cmd) => {
          if (cmd.name === "open-summarize") {
            updatedShortcuts.summarize = cmd.shortcut || "";
          } else if (cmd.name === "open-translate") {
            updatedShortcuts.translate = cmd.shortcut || "";
          } else if (cmd.name === "open-explain") {
            updatedShortcuts.explain = cmd.shortcut || "";
          } else if (cmd.name === "open-chat") {
            updatedShortcuts.chat = cmd.shortcut || "";
          }
        });

        setSettings((prev) => ({
          ...prev,
          shortcuts: updatedShortcuts
        }));

        console.log("[ShortcutSettings] current shortcuts:", updatedShortcuts);
      });
    }

    chrome.storage.local.get("shortcuts", ({ shortcuts }) => {
      if (shortcuts) {
        setSettings((prev) => ({
          ...prev,
          shortcuts: { ...prev.shortcuts, ...shortcuts }
        }));
      }
    });
  }, []);

  useEffect(() => {
    const handleKeydown = (e) => {
      const combo = [
        e.ctrlKey ? "Ctrl" : "",
        e.shiftKey ? "Shift" : "",
        e.altKey ? "Alt" : "",
        e.metaKey ? "Meta" : "",
        e.key.toUpperCase()
      ].filter(Boolean).join("+");

      const { summarize, translate, explain, chat } = settings.shortcuts;

      if (combo === summarize) {
        console.log("Trigger the Summarize shortcuts!");
        chrome.runtime.sendMessage({ type: "open-sidepanel", action: "summarize" });
      } else if (combo === translate) {
        console.log("Trigger the Translate shortcuts!");
        chrome.runtime.sendMessage({ type: "open-sidepanel", action: "translate" });
      } else if (combo === explain) {
        console.log("Trigger the Explain shortcuts!");
        chrome.runtime.sendMessage({ type: "open-sidepanel", action: "explain" });
      } else if (combo === chat) {
        console.log("Trigger the Chat shortcuts!")
        chrome.runtime.sendMessage({ type: "open-sidepanel", action: "chat" });
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [settings.shortcuts]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    if(key === 'defaultAction') {
      localStorage.setItem("defaultActiveTab", value);
    }

    if (key === 'theme') {
      localStorage.setItem('darkMode', value);
      
      if (value === 'false') {
        setIsDarkMode(false);
        applyDarkMode(false);
      } else if (value === 'true') {
        setIsDarkMode(true);
        applyDarkMode(true);
      } else if (value === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemPrefersDark);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
          setIsDarkMode(e.matches);
          applyDarkMode(e.matches);
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    }
  };

  const handleShortcutChange = (action, shortcut) => {
    setSettings(prev => {
      const newShortcuts = { ...prev.shortcuts, [action]: shortcut };
      const newSettings = { ...prev, shortcuts: newShortcuts };

      console.log("Updated shortcut:", action, shortcut);
      chrome.storage.local.set({ shortcuts: newShortcuts }, () => {
        console.log("Sync to chrome.storage.local:", newShortcuts);
      });

      return newSettings;
    });
  };

  const saveSettings = () => {
    localStorage.setItem('readBuddySettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetSettings = () => {
    const defaultSettings = {
      autoProcess: true,
      defaultAction: localStorage.getItem(DefaultActivePage),
      language: 'en',
      theme: 'light',
      shortcuts: {
        summarize: 'Alt+Shift+S',
        translate: 'Alt+Shift+T',
        explain: 'Alt+Shift+E',
        chat: 'Alt+Shift+C'
      }
    };
    setSettings(defaultSettings);
    setIsDarkMode(false);
    localStorage.setItem('readBuddySettings', JSON.stringify(defaultSettings));
    localStorage.setItem('darkMode', 'false');
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'readbuddy-settings.json';
    link.click();
  };

  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          ReadBuddy
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <NavItem 
          icon={Bookmark} 
          label="Saved Notes"
          onClick={() => window.location.href = 'notes.html?tab=saved'}
        />
        <NavItem 
          icon={Clock} 
          label="Reading List"
          onClick={() => window.location.href = 'notes.html?tab=reading'}
        />
        <NavItem 
          icon={Star} 
          label="Favorites"
          onClick={() => window.location.href = 'notes.html?tab=favorites'}
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <NavItem icon={Settings} label="Settings" active />
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, active = false, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
    </label>
  );

  return (
    <div className={isDarkMode ? 'true' : 'false'}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}>
          <SidebarNav />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customize your AI reading assistant</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={saveSettings}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    saved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved!' : 'Save Settings'}
                </button>
                <button
                  onClick={resetSettings}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">General</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-process selected text</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically process text when selected</p>
                        </div>
                        <ToggleSwitch
                          checked={settings.autoProcess}
                          onChange={(e) => handleSettingChange('autoProcess', e.target.checked)}
                        />
                      </div>

                      <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default action</label>
                        <select
                          value={settings.defaultAction}
                          onChange={(e) => handleSettingChange('defaultAction', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="summarize">Summarize</option>
                          <option value="translate">Translate</option>
                          <option value="explain">Explain</option>
                          <option value="chat">Chat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interface theme</label>
                        <select
                          value={settings.theme}
                          onChange={(e) => handleSettingChange('theme', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="false">Light</option>
                          <option value="true">Dark</option>
                          {/* <option value="auto">Auto</option> */}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Language</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default interface language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Keyboard Shortcuts</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Summarize</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quick summarize shortcut</p>
                        </div>
                        <input
                          type="text"
                          value={settings.shortcuts.summarize}
                          onChange={(e) => handleShortcutChange('summarize', e.target.value)}
                          className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Translate</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quick translate shortcut</p>
                        </div>
                        <input
                          type="text"
                          value={settings.shortcuts.translate}
                          onChange={(e) => handleShortcutChange('translate', e.target.value)}
                          className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Explain</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quick explain shortcut</p>
                        </div>
                        <input
                          type="text"
                          value={settings.shortcuts.explain}
                          onChange={(e) => handleShortcutChange('explain', e.target.value)}
                          className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat</span>
                          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>Quick chat shortcut</p>
                        </div>
                        <input
                          type="text"
                          value={settings.shortcuts.chat}
                          onChange={(e) => handleShortcutChange('chat', e.target.value)}
                          className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={exportSettings}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export Settings
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Version</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Local Processing</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">Active</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          ReadBuddy processes your data locally to protect your privacy. 
                          No personal information is sent to external servers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Support</h3>
                    
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <BookText className="w-4 h-4" />
                        User Guide
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Bug className="w-4 h-4" />
                        Report Bug
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Lightbulb className="w-4 h-4" />
                        Feature Request
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ReadBuddySettings />);