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
  const [isChatMode, setIsChatMode] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [summaryMode, setSummaryMode] = useState('paragraph');
  const [detailLevel, setDetailLevel] = useState('standard');
  const [showSummarySettings, setShowSummarySettings] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiSupport, setApiSupport] = useState({
    summarizer: false,
    translator: false,
    detect: false,
    prompt: false,
    chatbot: false
  });

  useEffect(() => {
    checkAPISupport();
  }, []);

  const checkAPISupport = async () => {
    let support = {
      summarizer: false,
      translator: false,
      detect: false,
      prompt: false,
      chatbot: false
    };

    try {
      const status_summarizer = await Summarizer.availability();
      const status_translator = await Translator.availability({
        sourceLanguage: 'en', 
        targetLanguage: 'zh'  
      });
      const status_detect = await LanguageDetector.availability();
      const status_prompt = await LanguageModel.availability();
      const status_chatbot = await LanguageModel.availability();

      console.log('Summarizer availability status:', status_summarizer);
      console.log('Translator availability status:', status_translator);
      console.log('Language Detector availability status:', status_detect);
      console.log('Language prompt availability status:', status_prompt);
      console.log('Language prompt availability status:', status_chatbot);

      if (status_summarizer === 'available') {
        console.log('✅ Summarizer is supported and ready to use.');
        support = { ...support, summarizer: true };
      } else {
        console.log('❌ Summarizer is not available. Returned:', status_summarizer);
      }

      if (status_translator === 'available') {
        console.log('✅ Translator is supported and ready to use.');
        support = { ...support, translator: true };
      } else {
        console.log('❌ Translator is not available. Returned:', status_translator);
      }

      if (status_detect === 'available') {
        console.log('✅ Language Detector is supported and ready to use.');
        support = { ...support, detect: true };
      } else {
        console.log('❌ Language Detector is not available. Returned:', status_detect);
      }

      if(status_prompt === 'available') {
        console.log('✅ Language prompt is supported and ready to use.');
        support = { ...support, prompt: true };
      } else {
        console.log('❌ Language prompt is not available. Returned:', status_prompt);
      }

      if(status_chatbot === 'available'){
        console.log('✅ Chatbot is supported and ready to use.');
        support = { ...support, chatbot: true };
      } else {
        console.log('❌ Chatbot is not available. Returned:', status_chatbot);
      }
    } catch (error) {
      console.error('Error checking API support:', error);
    }

    setApiSupport(support);
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
  // const handleDragEnter = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setDragCounter(prev => prev + 1);
  //   if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
  //     setIsDragging(true);
  //   }
  // };

  // const handleDragLeave = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setDragCounter(prev => prev - 1);
  //   if (dragCounter <= 1) {
  //     setIsDragging(false);
  //   }
  // };

  // const handleDragOver = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  // };

  // const handleDrop = (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   setIsDragging(false);
  //   setDragCounter(0);

  //   const data = e.dataTransfer;
    
  //   // Handle text data
  //   if (data.types.includes('text/plain')) {
  //     const text = data.getData('text/plain');
  //     if (text.trim()) {
  //       setSelectedText(prev => prev ? prev + '\n\n' + text : text);
  //     }
  //   }
    
  //   // Handle files (like PDF)
  //   if (data.files && data.files.length > 0) {
  //     const file = data.files[0];
  //     if (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')) {
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         const content = e.target.result;
  //         if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
  //           setSelectedText(prev => prev ? prev + '\n\n' + content : content);
  //         } else {
  //           setSelectedText(prev => prev ? prev + '\n\n[PDF Content: ' + file.name + ']' : '[PDF Content: ' + file.name + ']');
  //         }
  //       };
        
  //       if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
  //         reader.readAsText(file);
  //       } else {
  //         setSelectedText(prev => prev ? prev + '\n\n[PDF Content: ' + file.name + ']' : '[PDF Content: ' + file.name + ']');
  //       }
  //     }
  //   }
  // };
  

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
        throw new Error('❌ Summarizer API not supported');
      }

      const detailConfig = {
        concise: { type: 'tldr', length: 'short' },
        standard: { type: 'key-points', length: 'medium' },
        detailed: { type: 'key-points', length: 'long' }
      };

      const formatConfig = {
        bullets: 'markdown',
        paragraph: 'plain-text',
        qa: 'markdown'
      };

      const config = detailConfig[detailLevel];
      const format = formatConfig[summaryMode];

      const summarizer = await Summarizer.create({
        type: config.type,
        format: format,
        length: config.length,
        outputLanguage: 'en', 
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const percent = Math.round((e.loaded / e.total) * 100);
            console.log(`Downloading summarizer model: ${percent}% (${e.loaded}/${e.total})`);
          });
        }
      });

      let summary = await summarizer.summarize(text);
      summarizer.destroy();
      
      if (summaryMode === 'bullets' && !summary.includes('•') && !summary.includes('-')) {
        const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
        summary = sentences.slice(0, detailLevel === 'concise' ? 3 : detailLevel === 'standard' ? 5 : 7)
          .map(s => `• ${s.trim()}`)
          .join('\n');
      } else if (summaryMode === 'qa') {
        if (!apiSupport.prompt) {
          throw new Error('❌ Prompt API not available for Q&A generation');
        }

        const prompt = `
          Based on the following summary, generate minimum 3, maxmimum 5 as more as possible detailed Q&A pairs.
          - Cover background, detailed reasoning, potential implications, and author's perspective.
          - Keep answers concise but informative.
          Summary:
          "${summary}"
          
          Format:
          Q1: ...
          A1: ...
          Q2: ...
          A2: ...
        `;

        const session = await LanguageModel.create({
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(`Downloaded prompt language model: ${e.loaded * 100}%`);
            });
          },
        });

        const extraQA = await session.prompt(prompt);

        summary = `**In-Depth Q&A Based on Summary:**\n${extraQA}`;
      }

      return `**Summary (${detailLevel.charAt(0).toUpperCase() + detailLevel.slice(1)} - ${summaryMode === 'bullets' ? 'Bullet Points' : summaryMode === 'paragraph' ? 'Paragraph' : 'Q&A'}):**\n\n${summary}`;

    } catch (error) {
      console.error('⚠️ Summarizer API error:', error);

      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const pointCount = detailLevel === 'concise' ? 3 : detailLevel === 'standard' ? 5 : 7;
      
      let fallbackSummary;
      if (summaryMode === 'bullets') {
        fallbackSummary = sentences.slice(0, pointCount).map(s => `• ${s.trim()}`).join('\n');
      } else if (summaryMode === 'qa') {
        fallbackSummary = `**Q: What is this text about?**\nA: ${sentences.slice(0, 2).join('. ')}\n\n**Q: What are the key points?**\nA: ${sentences.slice(2, pointCount).join('. ')}`;
      } else {
        fallbackSummary = sentences.slice(0, pointCount).join('. ');
      }

      return `**Summary (${detailLevel.charAt(0).toUpperCase() + detailLevel.slice(1)} - Fallback Mode):**\n\n${fallbackSummary || '• Unable to summarize this text\n• Try providing shorter or clearer content'}`;
    }
  };

  const getTranslator = async (sourceLang, targetLang) => {
    return await Translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const percent = Math.round((e.loaded / e.total) * 100);
          console.log(`📥 Downloading model: ${percent}% (${e.loaded}/${e.total})`);
        });
      }
    });
  };

  const translateText = async (text, sourceLang, targetLang) => {
    try {
      if (!apiSupport.translator) throw new Error('❌ Translator API not supported');
      if (!apiSupport.detect) throw new Error('❌ Language Detector API not supported');

      let fromLang = sourceLang;

      if (sourceLang === 'auto') {
        console.log('🔍 Detecting language...');
        const detector = await LanguageDetector.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              const percent = Math.round((e.loaded / e.total) * 100);
              console.log(`📥 Downloading language detector: ${percent}%`);
            });
          }
        });
        const result = await detector.detect(text);
        fromLang = result[0]?.detectedLanguage || 'en';
        detector.destroy();
        console.log(`✅ Detected language: ${fromLang}`);
      }

      if (fromLang === targetLang) {
        return `Text is already in target language (${targetLang.toUpperCase()}):\n\n${text}`;
      }

      const translator = await getTranslator(fromLang, targetLang);
      const translation = await translator.translate(text);
      translator.destroy();

      const fromLangName = languages.find(l => l.code === fromLang)?.name || fromLang.toUpperCase();
      const toLangName = languages.find(l => l.code === targetLang)?.name || targetLang.toUpperCase();

      return `**Translation (${fromLangName} → ${toLangName}):**\n\n${translation}`;
    } catch (error) {
      console.error('⚠️ Translator API error:', error);
      return '❌ Translation failed. Please ensure Chrome AI Translator API is enabled.';
    }
  };

  const explainText = async (text, useDeepExplain) => {    
    if (useDeepExplain) {
      return '🌐 **Deep Explanation (Online Model):**\n\nThis concept encompasses multiple dimensions and can be understood through various theoretical frameworks. The underlying principles involve:\n\n• **Historical Context**: Understanding how this concept developed over time\n• **Technical Implementation**: The practical aspects and mechanisms involved\n• **Real-world Applications**: How this applies in various scenarios and industries\n• **Related Concepts**: Connections to other important ideas and theories\n• **Future Implications**: Potential developments and considerations going forward\n\n*Note: This explanation uses online processing for comprehensive analysis.*';
      } else {
        if (!apiSupport.prompt) {
          throw new Error('❌ Prompt API not available for explanation generation');
        }

        const prompt = `
        Provide a detailed yet easy-to-understand explanation based on the following summary. 
        - Start with a brief overview of the main idea.  
        - Then explain the key points in detail, including background context, reasoning, and potential implications.  
        - Highlight the author's perspective if present.  
        - Use clear, concise sentences that are suitable for a general audience.  
        - Structure the response in paragraphs for readability.

        Summary:
        "${text}"

        Format:
        **Overview:** ...
        **Detailed Explanation:** ...
        **Implications/Author's View:** ...
        `;

        const session = await LanguageModel.create({
          monitor(m) {
            m.addEventListener("downloadprogress", (e) => {
              console.log(`Downloaded explanation language model: ${e.loaded * 100}%`);
            });
          },
        });

        const explanation = await session.prompt(prompt);

        return `**Detailed Explanation:**\n${explanation}`;
      }
  };

  const chatbotText = async (text, isNewConversation = false) => {
    if (!apiSupport.chatbot) {
      throw new Error('❌ Chatbot API not supported');
    }

    if (isNewConversation) {
      setChatHistory([]);
    }

    setIsStreaming(true);
    
    try {
      const chatbot = await LanguageModel.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const percent = Math.round((e.loaded / e.total) * 100);
            console.log(`Downloading chatbot model: ${percent}%`);
          });
        }
      });

      // Add user message to chat history
      const userMessage = { type: 'user', content: text, timestamp: Date.now() };
      setChatHistory(prev => [...prev, userMessage]);

      const response = await chatbot.prompt(text);

      // Add bot response to chat history
      const botMessage = { type: 'bot', content: response, timestamp: Date.now() };
      setChatHistory(prev => [...prev, botMessage]);

      return response;
    } finally {
      setIsStreaming(false);
    }
  };

  const handleChatSend = async () => {
    if (!currentMessage.trim() || isStreaming) return;
    
    const message = currentMessage.trim();
    setCurrentMessage('');
    
    try {
      await chatbotText(message);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { 
        type: 'bot', 
        content: '❌ Sorry, I encountered an error. Please try again.', 
        timestamp: Date.now() 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setCurrentMessage('');
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
        case 'chat':
          if (chatHistory.length === 0 && text.trim()) {
            setIsChatMode(true);
            processedResult =await chatbotText(text);
            setSelectedText('');
          }
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
    { id: 'explain', label: 'Explain', icon: '💡', color: 'amber' },
    { id: 'chat', label: 'Chat', icon: '💬', color: 'purple' }
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
            {/* Settings Toggle */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowSummarySettings(!showSummarySettings)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🔍︎</span>
                  <span className="font-medium text-gray-800">Result</span>
                  <span className="text-xs text-gray-500">
                    {summaryMode === 'bullets' ? 'Bullets' : summaryMode === 'paragraph' ? 'Paragraph' : 'Q&A'} · {detailLevel}
                  </span>
                </div>
                <span className={`text-gray-400 transition-transform duration-200 ${showSummarySettings ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showSummarySettings && (
                <div className="p-3 bg-white border-t border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Summary Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Summary Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bullets', label: 'Bullets', icon: '•' },
                        { id: 'paragraph', label: 'Paragraph', icon: '¶' },
                        { id: 'qa', label: 'Q&A', icon: '?' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setSummaryMode(mode.id)}
                          className={`p-2 rounded border text-xs font-medium transition-colors duration-200 ${
                            summaryMode === mode.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="mr-1">{mode.icon}</span>
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detail Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detail Level</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'concise', label: 'Concise' },
                        { id: 'standard', label: 'Standard' },
                        { id: 'detailed', label: 'Detailed' }
                      ].map((level) => (
                        <label key={level.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="detailLevel"
                            value={level.id}
                            checked={detailLevel === level.id}
                            onChange={(e) => setDetailLevel(e.target.value)}
                            className="mr-2 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* API Support Indicator */}
            <div className={`text-xs p-2 rounded ${apiSupport.summarizer ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {apiSupport.summarizer ? '✅ Using Chrome Summarizer API' : '⚠️ Using fallback summarization'}
            </div>
          </div>
        );
      
      case 'chat':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {chatHistory.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Start a conversation with the AI assistant</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Ask questions, request explanations, or just chat!
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-purple-500 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Streaming indicator */}
                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Assistant Status */}
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">🤖</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">AI Assistant</p>
                  <p className="text-xs text-gray-600">
                    {apiSupport.chatbot ? 'Ready to chat' : 'Chatbot unavailable'}
                  </p>
                </div>
              </div>
              {chatHistory.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {selectedText.trim() && (
                <button
                  onClick={() => setCurrentMessage(selectedText.trim())}
                  className="px-3 py-2 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors flex items-center space-x-1"
                >
                  <span>📄</span>
                  <span>Paste Selected Text</span>
                </button>
              )}

              <button
                onClick={extractPageContent}
                className="px-3 py-2 bg-green-100 text-green-700 text-xs rounded-md hover:bg-green-200 transition-colors flex items-center space-x-1"
              >
                <span>📖</span>
                <span>Read Page</span>
              </button>
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="Type your message... (Press Enter to send)"
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="2"
                  disabled={!apiSupport.chatbot || isStreaming}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!currentMessage.trim() || !apiSupport.chatbot || isStreaming}
                  className="absolute right-2 bottom-2 p-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* API Support Indicator */}
            <div className={`text-xs p-2 rounded ${apiSupport.chatbot ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {apiSupport.chatbot ? '✅ Using Chrome Chatbot API' : '❌ Chatbot API not available'}
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

      {/* Animated Tabs */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative grid grid-cols-4 gap-0.5 bg-gray-200 rounded-lg p-1">
          {/* Animated Background */}
          <div 
            className="absolute top-1 bottom-1 bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
            style={{
              left: `calc(${tabs.findIndex(t => t.id === activeTab)} * 25% + 0.125rem)`,
              width: 'calc(25% - 0.25rem)'
            }}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center py-2 px-1 rounded-md text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id 
                  ? 'text-gray-900 z-10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className={`text-sm mb-0.5 transition-transform duration-300 ${
                activeTab === tab.id ? 'scale-110' : 'scale-100'
              }`}>
                {tab.icon}
              </span>
              <span className="leading-tight text-center">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Animated Content */}
      <div className="flex-1 p-4 overflow-y-auto ">
        {!isChatMode && (
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
        )}

        {/* Tab-specific Content with Animation */}
        <div className="mb-6 min-h-auto">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderTabContent()}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (activeTab === 'chat') {
              if (selectedText.trim()) {
                chatbotText(selectedText.trim());
                setSelectedText('');
              }
            } else {
              processText(activeTab, selectedText);
            }
          }}
          disabled={
            activeTab === 'chat' 
              ? (!selectedText.trim() && chatHistory.length > 0) || isStreaming
              : isLoading || !selectedText.trim()
          }
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none ${
            activeTab === 'summarize' ? 'bg-blue-500 hover:bg-blue-600' :
            activeTab === 'translate' ? 'bg-green-500 hover:bg-green-600' :
            activeTab === 'chat' ? 'bg-purple-500 hover:bg-purple-600' :
            'bg-amber-500 hover:bg-amber-600'
          } text-white ${
            (activeTab === 'chat' 
              ? (!selectedText.trim() && chatHistory.length > 0) || isStreaming
              : isLoading || !selectedText.trim()) 
            ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {activeTab === 'chat' && isStreaming ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI is thinking...</span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : activeTab === 'chat' ? (
            chatHistory.length === 0 ? 'Start Conversation' : 'New Topic'
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
              (activeTab === 'summarize' && apiSupport.summarizer) || (activeTab === 'translate' && apiSupport.translator) || (activeTab === 'explain' && apiSupport.prompt || (activeTab === 'chat' && apiSupport.chatbot)) ? 'bg-green-400' :
              'bg-yellow-400'
            }`}></div>
            <span>
              {(activeTab === 'explain' && deepExplain) ? 'Online Processing' : 
               (activeTab === 'summarize' && apiSupport.summarizer) || (activeTab === 'translate' && apiSupport.translator) || (activeTab === 'explain' && apiSupport.prompt || (activeTab === 'chat' && apiSupport.chatbot)) ? 'Chrome API' :
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

        @keyframes slide-in-from-top-2 {
          from { 
            opacity: 0;
            transform: translateY(-8px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-in-from-top-2 {
          animation-name: slide-in-from-top-2;
        }
      `}</style>
    </div>
  );
};

// Mount sidepanel
ReactDOM.createRoot(document.getElementById('root')).render(<SidePanel />)