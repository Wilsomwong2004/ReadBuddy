import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    autoProcess: true,
    defaultAction: 'summarize',
    language: 'en',
    theme: 'light',
    showStats: true,
    privacyMode: true,
    shortcuts: {
      summarize: 'Ctrl+Shift+S',
      translate: 'Ctrl+Shift+T',
      explain: 'Ctrl+Shift+E'
    }
  });

  const [saved, setSaved] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    chrome.storage.sync.get(['readbuddySettings'], (result) => {
      if (result.readbuddySettings) {
        setSettings(result.readbuddySettings);
      }
    });
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleShortcutChange = (action, shortcut) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [action]: shortcut
      }
    }));
  };

  const saveSettings = () => {
    chrome.storage.sync.set({ readbuddySettings: settings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      autoProcess: true,
      defaultAction: 'summarize',
      language: 'en',
      theme: 'light',
      showStats: true,
      privacyMode: true,
      shortcuts: {
        summarize: 'Ctrl+Shift+S',
        translate: 'Ctrl+Shift+T',
        explain: 'Ctrl+Shift+E'
      }
    };
    setSettings(defaultSettings);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
                📚
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ReadBuddy Settings</h1>
                <p className="text-sm text-gray-500">Customize your AI reading assistant</p>
              </div>
            </div>
            <button
              onClick={() => window.close()}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto-process selected text</label>
                    <p className="text-xs text-gray-500">Automatically process text when selected</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoProcess}
                      onChange={(e) => handleSettingChange('autoProcess', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Show statistics</label>
                    <p className="text-xs text-gray-500">Display usage stats in popup</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showStats}
                      onChange={(e) => handleSettingChange('showStats', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default action</label>
                  <select
                    value={settings.defaultAction}
                    onChange={(e) => handleSettingChange('defaultAction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="summarize">Summarize</option>
                    <option value="translate">Translate</option>
                    <option value="explain">Explain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interface theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Language</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default translation language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Summarize</span>
                    <p className="text-xs text-gray-500">Quick summarize shortcut</p>
                  </div>
                  <input
                    type="text"
                    value={settings.shortcuts.summarize}
                    onChange={(e) => handleShortcutChange('summarize', e.target.value)}
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Translate</span>
                    <p className="text-xs text-gray-500">Quick translate shortcut</p>
                  </div>
                  <input
                    type="text"
                    value={settings.shortcuts.translate}
                    onChange={(e) => handleShortcutChange('translate', e.target.value)}
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Explain</span>
                    <p className="text-xs text-gray-500">Quick explain shortcut</p>
                  </div>
                  <input
                    type="text"
                    value={settings.shortcuts.explain}
                    onChange={(e) => handleShortcutChange('explain', e.target.value)}
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Privacy mode</label>
                  <p className="text-xs text-gray-500">Process data locally when possible</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacyMode}
                    onChange={(e) => handleSettingChange('privacyMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={saveSettings}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {saved ? '✓ Saved!' : 'Save Settings'}
                </button>
                
                <button
                  onClick={resetSettings}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reset to Default
                </button>
                
                <button
                  onClick={exportSettings}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Export Settings
                </button>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Local Processing</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="font-medium">Active</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs">
                    ReadBuddy processes your data locally to protect your privacy. 
                    No personal information is sent to external servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
              
              <div className="space-y-3">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  📖 User Guide
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  🐛 Report Bug
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  💡 Feature Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mount settings page
ReactDOM.createRoot(document.getElementById('root')).render(<Settings />);