import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BookOpen, Github, Heart, Settings, Link} from 'lucide-react';
import { loadDarkMode, saveDarkMode, applyDarkMode } from './utils/darkMode';
import DarkModeButton from './utils/darkModeBtn';

const Popup = () => {
  const [stats, setStats] = useState({
    notes: 0,
  });

  const [isEnabled, setIsEnabled] = useState(null); 
  const [isDarkMode, setIsDarkMode] = useState("");
  const [os, setOS] = useState("Unknown OS");
  const [shortcuts, setShortcuts] = useState({
    summarize: "Alt+Shift+S",
    translate: "Alt+Shift+T",
    explain: "Alt+Shift+E",
    chat: "Alt+Shift+C",
  });

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

    chrome.storage.local.get("shortcuts", (data) => {
      if (data.shortcuts) {
        setShortcuts(data.shortcuts);
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ isEnabled });
  }, [isEnabled]);

  useEffect(() => {
    chrome.storage.local.get(["isEnabled"], (result) => {
      if (typeof result.isEnabled === "boolean") {
        setIsEnabled(result.isEnabled);
      } else {
        setIsEnabled(true);
        chrome.storage.local.set({ isEnabled: true });
      }
    });
  }, []);

  useEffect(() => {
    loadDarkMode((isDark) => { 
      setIsDarkMode(isDark);
    });

    chrome.storage.local.get(["savedItems"], (result) => {
      const savedItems = result.savedItems || [];
      setStats({ notes: savedItems.length });
    });
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
    saveDarkMode(newDarkMode);
  };

  // const handleToggle = () => {
  //   const newValue = !isEnabled;
  //   setIsEnabled(newValue);
  //   chrome.storage.local.set({ isEnabled: newValue });
  // };

  const openSidePanel = (tabName) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.storage.local.set({ activeTab: tabName }, () => {
        chrome.sidePanel.open({ tabId: tabs[0].id });
        window.close();
      });
    });
  };

  const openSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    window.close();
  };

  const openNotes = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('notes.html') });
    window.close();
  };

  const formatShortcut = (shortcut) => {
    if (!shortcut) return "";
    if (os === "Mac OS") {
      return shortcut
        .replace(/Alt\+/g, "⌥")
        .replace(/Shift\+/g, "⇧")
        .replace(/Ctrl\+/g, "⌃")
        .replace(/Command\+/g, "⌘");
    } else {
      return shortcut
        .replace(/⌥/g, "Alt+")
        .replace(/⇧/g, "Shift+")
        .replace(/⌃/g, "Ctrl+")
        .replace(/⌘/g, "Meta+");
    }
  };

  const actions = [
    {
      id: 'summarize',
      title: 'Summarize',
      icon: '📝',
      gradient: 'from-violet-50 to-purple-50 dark:from-violet-900 dark:to-purple-800',
      hoverGradient: 'hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-800 dark:hover:to-purple-700',
      border: 'border-violet-200 dark:border-violet-700'
    },
    {
      id: 'translate',
      title: 'Translate',
      icon: '🌐',
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-800',
      hoverGradient: 'hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800 dark:hover:to-teal-700',
      border: 'border-emerald-200 dark:border-emerald-700'
    },
    {
      id: 'explain',
      title: 'Explain',
      icon: '💡',
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-800',
      hoverGradient: 'hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800 dark:hover:to-cyan-700',
      border: 'border-blue-200 dark:border-blue-700'
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: '💬',
      gradient: 'from-pink-50 to-rose-50 dark:from-pink-900 dark:to-rose-800',
      hoverGradient: 'hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-800 dark:hover:to-rose-700',
      border: 'border-pink-200 dark:border-pink-700'
    }
  ];

  return (
    <div className="w-80 bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <div className="p-4 pb-0 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center dark:bg-gray-900">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-xl">ReadBuddy</span>
          </div>

          <div className="flex justify-center gap-2">
            <DarkModeButton />
            <button
              onClick={openSettings}
              aria-label="Open settings"
            >
              <Settings className='w-4 h-4 text-gray-300 dark:text-gray-700 hover:cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-all'/>
            </button>
          </div>
        </div>
{/* 
        <button
          onClick={handleToggle}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
            isEnabled
              ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
              : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span
              className={`text-sm font-medium ${
                isEnabled
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {isEnabled ? 'ReadBuddy Active' : 'ReadBuddy Disabled'}
            </span>
          </div>
          <div
            className={`text-xs px-2 py-1 rounded ${
              isEnabled
                ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </div>
        </button> */}
      </div>

      {/* Notes Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">NOTES</div>
        <button
          onClick={openNotes}
          aria-label="Open notes"
          className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-800 border border-amber-200 dark:border-amber-700 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-800 dark:hover:to-orange-700 transition-all group"
        >
          <div className="flex items-center space-x-3">
            
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl">📒</div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-gray-100">My Notes</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">{stats.notes} saved notes</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 pb-6">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">QUICK ACTIONS</div>
        <div className="space-y-1.5">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => openSidePanel(action.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${action.gradient} ${action.hoverGradient} border ${action.border} transition-all group`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{action.icon}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{action.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                {shortcuts[action.id] && (
                  <span className="text-xs text-gray-400 dark:text-gray-300 font-mono">
                    {formatShortcut(shortcuts[action.id])}
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-500 dark:text-red-600" />
              <span>Version 1.0.0</span>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="https://github.com/Wilsomwong2004/ReadBuddy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 dark:text-blue-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://wilsomwong.space/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <Link className="w-4 h-4 dark:text-purple-600 text-purple-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" />
              </a>
            </div>
          </div>
        </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Popup />);
