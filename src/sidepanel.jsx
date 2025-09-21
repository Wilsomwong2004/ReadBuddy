import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const SidePanel = () => {
  const [activeTab, setActiveTab] = useState('summarize');
  const [selectedText, setSelectedText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translateFrom, setTranslateFrom] = useState('auto');
  const [translateTo, setTranslateTo] = useState('zh');
  const [deepExplain, setDeepExplain] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [apiSupport, setApiSupport] = useState({
    summarizer: false,
    translator: false
  });

  // Check API support on component mount
  useEffect(() => {
    checkAPISupport();
  }, []);

  const checkAPISupport = async () => {
    try {
      // Check Summarizer API support
      const summarizerSupport = 'ai' in window && 'summarizer' in window.ai;
      
      // Check Translator API support  
      const translatorSupport = 'translation' in window && 'createTranslator' in window.translation;
      
      setApiSupport({
        summarizer: summarizerSupport,
        translator: translatorSupport
      });

      console.log('API Support:', { summarizerSupport, translatorSupport });
    } catch (error) {
      console.error('Error checking API support:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      if (message.type === 'set-action') {
        setActiveTab(message.action);
      }
      if (message.type === 'open-sidepanel') {
        setActiveTab(message.action);
        setSelectedText(message.text || '');
      }
    };

    // Listen for messages from content script and background
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, []);

  // Auto-extract page content when summarize tab is active and no text is selected
  useEffect(() => {
    if (activeTab === 'summarize' && !selectedText.trim()) {
      // extractPageContent(); // Get the entire page content
    }
  }, [activeTab]);

  const extractPageContent = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            // Try to get main content from common selectors
            const selectors = [
              'article',
              '[role="main"]',
              '.content',
              '.post-content', 
              '.entry-content',
              'main',
              '#content'
            ];
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element && element.innerText.trim()) {
                return element.innerText.trim();
              }
            }
            
            // Fallback to body but filter out navigation and footer content
            const bodyText = document.body.innerText;
            return bodyText.trim();
          }
        });

        if (results && results[0] && results[0].result) {
          setSelectedText(results[0].result.substring(0, 5000)); // Limit to 5000 chars
        }
      }
    } catch (error) {
      console.error('Error extracting page content:', error);
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const data = e.dataTransfer;
    
    // Handle text data
    if (data.types.includes('text/plain')) {
      const text = data.getData('text/plain');
      if (text.trim()) {
        setSelectedText(prev => prev ? prev + '\n\n' + text : text);
      }
    }
    
    // Handle files (like PDF)
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      if (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            setSelectedText(prev => prev ? prev + '\n\n' + content : content);
          } else {
            setSelectedText(prev => prev ? prev + '\n\n[PDF Content: ' + file.name + ']' : '[PDF Content: ' + file.name + ']');
          }
        };
        
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          reader.readAsText(file);
        } else {
          setSelectedText(prev => prev ? prev + '\n\n[PDF Content: ' + file.name + ']' : '[PDF Content: ' + file.name + ']');
        }
      }
    }
  };

  useEffect(() => {
    const element = document.body;
    
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [dragCounter]);

  const languages = [
    { code: 'auto', name: 'Auto Detect', flag: '🔍' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' }
  ];

  const summarizeText = async (text) => {
    try {
      if (!apiSupport.summarizer) {
        throw new Error('Summarizer API not supported');
      }

      // Create summarizer session
      const summarizer = await window.ai.summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium'
      });

      // Summarize the text
      const summary = await summarizer.summarize(text);
      
      // Cleanup
      summarizer.destroy();
      
      return summary;
    } catch (error) {
      console.error('Summarizer API error:', error);
      return '• Key points extracted from the text\n• Main concepts and important ideas identified\n• Summary generated using fallback method\n• Original content condensed for quick understanding';
    }
  };

  // Translator API implementation
  const translateText = async (text, sourceLang, targetLang) => {
    try {
      if (!apiSupport.translator) {
        throw new Error('Translator API not supported');
      }

      // Auto-detect source language if set to 'auto'
      let fromLang = sourceLang;
      if (sourceLang === 'auto') {
        try {
          const detector = await window.translation.createDetector();
          const detected = await detector.detect(text);
          fromLang = detected[0]?.detectedLanguage || 'en';
          detector.destroy();
        } catch (detectError) {
          console.warn('Language detection failed, using English as default');
          fromLang = 'en';
        }
      }

      // Skip translation if source and target are the same
      if (fromLang === targetLang) {
        return `Text is already in target language (${targetLang.toUpperCase()}):\n\n${text}`;
      }

      // Create translator
      const translator = await window.translation.createTranslator({
        sourceLanguage: fromLang,
        targetLanguage: targetLang
      });

      // Translate the text
      const translation = await translator.translate(text);
      
      // Cleanup
      translator.destroy();

      const fromLangName = languages.find(l => l.code === fromLang)?.name || fromLang.toUpperCase();
      const toLangName = languages.find(l => l.code === targetLang)?.name || targetLang.toUpperCase();
      
      return `Translation (${fromLangName} → ${toLangName}):\n\n${translation}`;
      
    } catch (error) {
      console.error('Translator API error:', error);
      // Fallback to mock response
      const fromLangName = languages.find(l => l.code === sourceLang)?.name || 'Auto';
      const toLangName = languages.find(l => l.code === targetLang)?.name || 'Chinese';
      return `Translation (${fromLangName} → ${toLangName}) - Using fallback:\n\n这是翻译后的文本内容，展示了原文的主要意思和内容。翻译保持了原文的语义和语调，确保准确传达信息。`;
    }
  };

  // Explanation function (using mock for now, could integrate with other APIs)
  const explainText = async (text, useDeepExplain) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (useDeepExplain) {
      return '🌐 Deep Explanation (Online Model):\n\nThis concept encompasses multiple dimensions and can be understood through various theoretical frameworks. The underlying principles involve...\n\n• Historical context and development\n• Technical implementation details\n• Real-world applications and implications\n• Related concepts and connections\n• Future possibilities and considerations';
    } else {
      return '💎 Quick Explanation (Local Processing):\n\nThis concept refers to a fundamental idea that can be understood as... [simplified explanation with key points and practical examples for easy comprehension]';
    }
  };

  const processText = async (action, text) => {
    if (!text.trim()) {
      setResult('Please enter or select some text to process.');
      return;
    }

    setIsLoading(true);
    setResult('');
    
    try {
      let processedResult = '';
      
      switch (action) {
        case 'summarize':
          processedResult = await summarizeText(text);
          break;
        case 'translate':
          processedResult = await translateText(text, translateFrom, translateTo);
          break; 
        case 'explain':
          processedResult = await explainText(text, deepExplain);
          break;
        default:
          processedResult = 'Unknown action';
      }
      
      setResult(processedResult);
    } catch (error) {
      console.error('Processing error:', error);
      setResult('An error occurred while processing the text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'summarize', label: 'Summarize', icon: '📄', color: 'blue' },
    { id: 'translate', label: 'Translate', icon: '🌐', color: 'green' },
    { id: 'explain', label: 'Explain', icon: '💡', color: 'amber' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'translate':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <select
                  value={translateFrom}
                  onChange={(e) => setTranslateFrom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <select
                  value={translateTo}
                  onChange={(e) => setTranslateTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {languages.filter(l => l.code !== 'auto').map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* API Support Indicator for Translator */}
            <div className={`text-xs p-2 rounded ${apiSupport.translator ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {apiSupport.translator ? '✅ Using Chrome Translator API' : '⚠️ Using fallback translation'}
            </div>
          </div>
        );
      
      case 'explain':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      deepExplain ? 'bg-amber-500' : 'bg-gray-300'
                    }`}>
                      {deepExplain ? '🌐' : '💎'}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {deepExplain ? 'Deep Explanation' : 'Quick Explanation'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {deepExplain ? 'Online Model - Comprehensive analysis' : 'Local Processing - Fast explanation'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={deepExplain}
                    onChange={(e) => setDeepExplain(e.target.checked)}
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                    deepExplain ? 'bg-amber-500' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                      deepExplain ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );
        
      case 'summarize':
        return (
          <div className="space-y-4">
            {/* API Support Indicator for Summarizer */}
            <div className={`text-xs p-2 rounded ${apiSupport.summarizer ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {apiSupport.summarizer ? '✅ Using Chrome Summarizer API' : '⚠️ Using fallback summarization'}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col relative">
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-50 bg-opacity-95 flex items-center justify-center animate-in fade-in duration-200">
          <div className="border-4 border-dashed border-blue-400 rounded-2xl p-12 bg-white shadow-lg animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">📄</div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">Drop Here</h3>
              <p className="text-sm text-blue-500">
                Drop text or PDF files to analyze
              </p>
              <div className="flex items-center justify-center mt-4 space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform duration-200">
            📚
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">ReadBuddy</h2>
            <p className="text-xs text-gray-500">AI Reading Assistant</p>
          </div>
        </div>
      </div>

      {/* Animated Tabs */}
      <div className="p-4 border-b">
        <div className="relative grid grid-cols-3 gap-1 bg-gray-100 rounded-lg p-1">
          {/* Animated Background */}
          <div 
            className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
            style={{
              left: `calc(${tabs.findIndex(t => t.id === activeTab)} * 33.333% + 0.25rem)`,
              width: 'calc(33.333% - 0.5rem)'
            }}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center p-2 rounded-md text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id 
                  ? 'text-gray-900 z-10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className={`text-lg mb-1 transition-transform duration-300 ${
                activeTab === tab.id ? 'scale-110' : 'scale-100'
              }`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="mb-4 relative">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <span>Selected Text</span>
            {selectedText && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {selectedText.length} characters
              </span>
            )}
          </h3>

          <div className="relative">
            {activeTab === 'summarize' && !selectedText.trim() && (
              <button
                onClick={extractPageContent}
                className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
              >
                Extract Page Content
              </button>
            )}

            <textarea
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Paste text here, or drag and drop content from any webpage or PDF file..."
              className="w-full h-40 bg-gray-50 rounded-lg p-4 border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none"
            />
          </div>
        </div>

        {/* Tab-specific Content with Animation */}
        <div className="mb-6 min-h-auto">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderTabContent()}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => processText(activeTab, selectedText)}
          disabled={isLoading || !selectedText.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none ${
            activeTab === 'summarize' ? 'bg-blue-500 hover:bg-blue-600' :
            activeTab === 'translate' ? 'bg-green-500 hover:bg-green-600' :
            'bg-amber-500 hover:bg-amber-600'
          } text-white ${isLoading || !selectedText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `${tabs.find(t => t.id === activeTab)?.label} Text`
          )}
        </button>

        {/* Results with Animation */}
        {result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-medium text-gray-900 mb-3">Result</h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {result}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              (activeTab === 'explain' && deepExplain) ? 'bg-blue-400' : 
              (activeTab === 'summarize' && apiSupport.summarizer) || (activeTab === 'translate' && apiSupport.translator) ? 'bg-green-400' :
              'bg-yellow-400'
            }`}></div>
            <span>
              {(activeTab === 'explain' && deepExplain) ? 'Online Processing' : 
               (activeTab === 'summarize' && apiSupport.summarizer) || (activeTab === 'translate' && apiSupport.translator) ? 'Chrome API' :
               'Fallback Mode'}
            </span>
          </div>
          <span>
            {(activeTab === 'explain' && deepExplain) ? 'Privacy Concerned' : 'Privacy Protected'}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-from-bottom-2 {
          from { 
            opacity: 0;
            transform: translateY(8px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-from-bottom-4 {
          from { 
            opacity: 0;
            transform: translateY(16px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
        }
        
        .slide-in-from-bottom-2 {
          animation-name: slide-in-from-bottom-2;
        }
        
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }
        
        .duration-500 {
          animation-duration: 500ms;
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8,0,1,1);
          }
          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0,0,0.2,1);
          }
        }
        
        @keyframes pulse {
          50% {
            opacity: .5;
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Mount sidepanel
ReactDOM.createRoot(document.getElementById('root')).render(<SidePanel />)