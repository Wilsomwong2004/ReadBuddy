import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BookOpen, Home, Clock, Star, Settings, Menu, X, Bookmark, Save, RotateCcw, Download, BookText, Bug, Lightbulb, Shield } from 'lucide-react';

const ReadBuddySettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saved, setSaved] = useState(false);
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600" />
          ReadBuddy
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <NavItem icon={Home} label="Home" />
        <NavItem icon={Bookmark} label="Saved" />
        <NavItem icon={Clock} label="Reading List" />
        <NavItem icon={Star} label="Favorites" />
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <NavItem icon={Settings} label="Settings" active />
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, active = false }) => (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600 font-medium' 
          : 'text-gray-600 hover:bg-gray-50'
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
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
                <p className="text-sm text-gray-500">Customize your AI reading assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Settings Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* General Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto-process selected text</label>
                        <p className="text-xs text-gray-500 mt-1">Automatically process text when selected</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.autoProcess}
                        onChange={(e) => handleSettingChange('autoProcess', e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Show statistics</label>
                        <p className="text-xs text-gray-500 mt-1">Display usage stats in popup</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.showStats}
                        onChange={(e) => handleSettingChange('showStats', e.target.checked)}
                      />
                    </div>

                    <div className="pb-4 border-b border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default action</label>
                      <select
                        value={settings.defaultAction}
                        onChange={(e) => handleSettingChange('defaultAction', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Language Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Language</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default translation language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Summarize</span>
                        <p className="text-xs text-gray-500 mt-1">Quick summarize shortcut</p>
                      </div>
                      <input
                        type="text"
                        value={settings.shortcuts.summarize}
                        onChange={(e) => handleShortcutChange('summarize', e.target.value)}
                        className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Translate</span>
                        <p className="text-xs text-gray-500 mt-1">Quick translate shortcut</p>
                      </div>
                      <input
                        type="text"
                        value={settings.shortcuts.translate}
                        onChange={(e) => handleShortcutChange('translate', e.target.value)}
                        className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Explain</span>
                        <p className="text-xs text-gray-500 mt-1">Quick explain shortcut</p>
                      </div>
                      <input
                        type="text"
                        value={settings.shortcuts.explain}
                        onChange={(e) => handleShortcutChange('explain', e.target.value)}
                        className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Privacy
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Privacy mode</label>
                      <p className="text-xs text-gray-500 mt-1">Process data locally when possible</p>
                    </div>
                    <ToggleSwitch
                      checked={settings.privacyMode}
                      onChange={(e) => handleSettingChange('privacyMode', e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                
                {/* Quick Actions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={exportSettings}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export Settings
                    </button>
                  </div>
                </div>

                {/* About */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Version</span>
                      <span className="font-medium text-gray-900">1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Local Processing</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">Active</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        ReadBuddy processes your data locally to protect your privacy. 
                        No personal information is sent to external servers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Support */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Support</h3>
                  
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <BookText className="w-4 h-4" />
                      User Guide
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Bug className="w-4 h-4" />
                      Report Bug
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
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
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ReadBuddySettings />);