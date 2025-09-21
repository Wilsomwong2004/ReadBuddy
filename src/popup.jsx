import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const Popup = () => {
  const [stats, setStats] = useState({
    articlesRead: 247,
    translations: 1200,
    explanations: 89
  });

  const openSidePanel = (action = null) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.sidePanel.open({tabId: tabs[0].id});
      if (action) {
        chrome.runtime.sendMessage({type: 'set-action', action}, () => {
          window.close();
        });
      } else {
        window.close();
      }
    });
  };

  const openSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    window.close();
    };

  const actions = [
    {
      id: 'summarize',
      title: 'Summarize',
      description: 'Get key points instantly',
      icon: '📝',
      color: 'blue'
    },
    {
      id: 'translate', 
      title: 'Translate',
      description: 'Translate any language',
      icon: '🌐',
      color: 'green'
    },
    {
      id: 'explain',
      title: 'Explain',
      description: 'Understand complex terms', 
      icon: '💡',
      color: 'amber'
    }
  ];

  return (
    <div className="w-80 h-full rounded-3xl bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            📚
          </div>
          <div>
            <h1 className="font-bold text-lg">ReadBuddy</h1>
            <p className="text-blue-100 text-xs">AI Reading Assistant</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gradient-to-b from-blue-50 to-white border-b flex-shrink-0">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-lg font-bold text-blue-600">{stats.articlesRead}</div>
            <div className="text-xs text-gray-500">Articles</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-lg font-bold text-green-600">{stats.translations}</div>
            <div className="text-xs text-gray-500">Translations</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-lg font-bold text-amber-600">{stats.explanations}</div>
            <div className="text-xs text-gray-500">Explanations</div>
          </div>
        </div>
      </div>

      {/* Scrollable Actions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => openSidePanel(action.id)}
                className="w-full flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-lg">
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{action.title}</div>
                  <div className="text-xs text-gray-500">{action.description}</div>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Local Processing</span>
          </div>
          <button 
            onClick={openSettings}
            className="hover:text-gray-700"
            >
            Settings
        </button>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Popup />)