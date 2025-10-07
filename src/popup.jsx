import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BookOpen, Settings } from 'lucide-react';
import { loadDarkMode, saveDarkMode, applyDarkMode } from './utils/darkMode';

const Popup = () => {
  const [stats, setStats] = useState({
    notes: 0,
  });

  const [isEnabled, setIsEnabled] = useState(null); 
  const [isDarkMode, setIsDarkMode] = useState("");

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

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    chrome.storage.local.set({ isEnabled: newValue });
  };

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

  const actions = [
    {
      id: 'summarize',
      title: 'Summarize',
      icon: '📝',
      shortcut: 'Alt+Shift+S',
      gradient: 'from-violet-50 to-purple-50 dark:from-violet-900 dark:to-purple-800',
      hoverGradient: 'hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-800 dark:hover:to-purple-700',
      border: 'border-violet-200 dark:border-violet-700'
    },
    {
      id: 'translate',
      title: 'Translate',
      icon: '🌐',
      shortcut: 'Alt+Shift+T',
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-800',
      hoverGradient: 'hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800 dark:hover:to-teal-700',
      border: 'border-emerald-200 dark:border-emerald-700'
    },
    {
      id: 'explain',
      title: 'Explain',
      icon: '💡',
      shortcut: 'Alt+Shift+E',
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-800',
      hoverGradient: 'hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800 dark:hover:to-cyan-700',
      border: 'border-blue-200 dark:border-blue-700'
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: '💬',
      shortcut: 'Alt+Shift+C',
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
            <button onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {isDarkMode ? (
                  <svg className="w-4 h-4 text-gray-700 hover:cursor-pointer hover:text-yellow-500 transition-all" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-700  hover:cursor-pointer hover:text-purple-600 transition-all" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
              )}
            </button>
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
      <div className="p-4">
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
                <span className="text-xs text-gray-400 dark:text-gray-300 font-mono">{action.shortcut}</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Chrome API</span>
          <span>Version 1.0.0</span>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Popup />);
