import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const SidePanel = () => {
  const [activeTab, setActiveTab] = useState('summarize');
  const [selectedText, setSelectedText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      if (message.type === 'set-action') {
        setActiveTab(message.action);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Mock AI processing functions
  const processText = async (action, text) => {
    setIsLoading(true);
    setResult('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    switch (action) {
      case 'summarize':
        setResult('• Key points from the selected text\n• Main concepts and ideas\n• Important takeaways');
        break;
      case 'translate':
        setResult('这是翻译后的文本内容，展示了原文的主要意思和内容。');
        break; 
      case 'explain':
        setResult('This concept refers to... [detailed explanation in simple terms]');
        break;
    }
    
    setIsLoading(false);
  };

  const tabs = [
    { id: 'summarize', label: 'Summarize', icon: '📝', color: 'blue' },
    { id: 'translate', label: 'Translate', icon: '🌐', color: 'green' },
    { id: 'explain', label: 'Explain', icon: '💡', color: 'amber' }
  ];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
            📚
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">ReadBuddy</h2>
            <p className="text-xs text-gray-500">AI Reading Assistant</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Action Button */}
        <button
          onClick={() => processText(activeTab, selectedText)}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'summarize' ? 'bg-blue-500 hover:bg-blue-600' :
            activeTab === 'translate' ? 'bg-green-500 hover:bg-green-600' :
            'bg-amber-500 hover:bg-amber-600'
          } text-white ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? 'Processing...' : `${tabs.find(t => t.id === activeTab)?.label} Text`}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Result</h3>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {result}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0 mt-auto">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Local Processing</span>
          </div>
          <span>Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};

// Mount sidepanel
ReactDOM.createRoot(document.getElementById('root')).render(<SidePanel />)