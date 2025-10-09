import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Settings, Save } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { loadDarkMode, saveDarkMode, applyDarkMode } from './utils/darkMode';
import './index.css';

const SidePanel = () => {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("defaultActiveTab") || "summarize");
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
  const [relatedConcepts, setRelatedConcepts] = useState("");
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState("");
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [pageMetadata, setPageMetadata] = useState([]);

  const[favorite, setFavorite] = useState(false);
  const [readingLater, setReadingLater] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [title, setTitle] = useState("");
  const [selectedNoteSpace, setSelectedNoteSpace] = useState(null);
  const [savedData, setSavedData] = useState(null);

  const [apiSupport, setApiSupport] = useState({
    summarizer: false,
    translator: false,
    detect: false,
    prompt: false,
    chatbot: false
  });

  let noteSpaces = []; 
  let isExtractButtonClicked = false;

  useEffect(() => {
    checkAPISupport();
  }, []);

 useEffect(() => {
    chrome.storage.local.get("activeTab", (data) => {
      if (data.activeTab) setActiveTab(data.activeTab);
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local" && changes.activeTab) {
        setActiveTab(changes.activeTab.newValue);
      }
    });
  }, []);

  useEffect(() => {
    loadDarkMode((isDark) => {
      setIsDarkMode(isDark);
    });
  }, []);

useEffect(() => {
  const handleMessage = (message, sender, sendResponse) => {
    console.log('[Sidebar] Received message:', message);
    console.log('[Sidebar] Message type:', message.type);
    console.log('[Sidebar] Message action:', message.action);
    console.log('[Sidebar] Message text length:', message.text?.length);
    
    if (
        message.type === 'set-action' || 
        message.type === 'open-sidepanel' || 
        message.type === 'open-sidepanel-from-command'
    ) {
      console.log(`[Sidebar] Setting active tab to: ${message.action}`);
      setActiveTab(message.action);
      
      if (message.type === 'open-sidepanel' && message.text) {
        const text = message.text;
        console.log('[Sidebar] Setting selected text:', text.substring(0, 50) + '...');
        setSelectedText(message.text);
        
        if (message.action !== 'chat') {
          console.log('[Sidebar] Auto-processing text for action:', message.action);
          
          const waitForAPI = setInterval(() => {
            const isReady = 
              (message.action === 'summarize' && apiSupport.summarizer) ||
              (message.action === 'translate' && apiSupport.translator) ||
              (message.action === 'explain' && apiSupport.prompt);
            
            if (isReady) {
              clearInterval(waitForAPI);
              processText(message.action, message.text);
            }
          }, 100);
          
          setTimeout(() => {
            clearInterval(waitForAPI);
            console.log('[Sidebar] API check timeout - processing anyway');
            processText(message.action, message.text);
          }, 5000);
        } else {
          console.log('[Sidebar] Chat action - setting current message');
          setCurrentMessage(text);
        }
      } else {
        console.log('[Sidebar] No text in message or wrong type');
      }
    }
    
    sendResponse({received: true});
  };

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('[Sidebar] Adding message listener');
    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      console.log('[Sidebar] Removing message listener');
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }
}, [apiSupport]); 

  // const handleSave = () => {
  //   setActivePanel("save");
  // };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyDarkMode(newDarkMode);
    saveDarkMode(newDarkMode);
  };

  const confirmSave = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;
      const savedItem = {
        id: Date.now(),
        title: title.trim(),
        text: selectedText,
        result: result,
        url: url,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        tags: categories,
        favorite: favorite,
        readingLater: readingLater,
        category: activeTab,
        date: new Date().toISOString().split('T')[0],
      };

      chrome.storage.local.get(['savedItems'], function (data) {
        const savedItems = data.savedItems || [];
        savedItems.push(savedItem);
        chrome.storage.local.set({ savedItems: savedItems }, function () {
          if (chrome.runtime.lastError) {
            console.error("Save failed:", chrome.runtime.lastError);
            showToast("❌ Failed to save. Please try again.");
            return;
          }
          showToast("✅ Saved successfully!");

          setTitle("");
          setCategories([]);
          setNewCategory("");
          setFavorite(false);
          setReadingLater(false);

          setActivePanel(null);
        });
      });
    });

    setSavedData(null);
  };

  const openSettings = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    window.close();
  };

  const openSave = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('notes.html') });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const endOfMessagesRef = useRef(null);
  useEffect(() => {
    if(endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isStreaming]);

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
    appId: import.meta.env.VITE_FIREBASE_APPID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID
  };

  const firebase = initializeApp(firebaseConfig);
  // const analytics = getAnalytics(firebase);
  const gemini_ai = getAI(firebase, { backend: new GoogleAIBackend() });
  const gemini_model = getGenerativeModel(gemini_ai, { model: "gemini-2.5-flash", mode: InferenceMode.PREFER_IN_CLOUD });

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
    return support; 
  };

  useEffect(() => {
    const handleMessage = (message, sender, sendResponse) => {
      if (
          message.type === 'set-action' || 
          message.type === 'open-sidepanel' || 
          message.type === 'open-sidepanel-from-command'
      ) {
        console.log(`Sidebar received action: ${message.action}`);
        setActiveTab(message.action);
        
        if (message.type === 'open-sidepanel') {
          setSelectedText(message.text || '');
        }
      }
      
      // if (typeof sendResponse === 'function') { return true; } 
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
      
      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'summarize' && !selectedText.trim()) {
      // extractPageContent(); // Get the entire page content
    }
  }, [activeTab]);

  const extractPageContent = async () => {
    isExtractButtonClicked = true;

    try {
      setIsLoading(true);
      setResult('🔄 Extracting page content...');

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const cacheKey = `page_${tab.id}_${tab.url}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          const { content, metadata, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('✅ Using cached content');
            setSelectedText(content);
            setPageMetadata(metadata);
            setResult('✅ Page content loaded from cache');
            setIsLoading(false);
            return { content, metadata };
          }
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractWithReadability
        });

        if (results && results[0] && results[0].result) {
          const { content, metadata } = results[0].result;
          
          sessionStorage.setItem(cacheKey, JSON.stringify({
            content,
            metadata,
            timestamp: Date.now()
          }));

          setSelectedText(content);
          setPageMetadata(metadata);
          
          console.log('📄 Extracted:', {
            title: metadata.title,
            length: content.length,
            words: content.split(/\s+/).length
          });

          // setResult(`✅ Extracted ${content.length.toLocaleString()} characters from page`);
          setIsLoading(false);
          return { content, metadata };
        }
      }
    } catch (error) {
      console.error('❌ Error extracting page content:', error);
      setResult(`❌ Failed to extract: ${error.message}`);
      setIsLoading(false);
      return null;
    }
  };

  function extractWithReadability() {
    try {
      const documentClone = document.cloneNode(true);
      
      if (typeof Readability !== 'undefined') {
        const article = new Readability(documentClone, {
          debug: false,
          maxElemsToParse: 0,
          nbTopCandidates: 5,
          charThreshold: 500
        }).parse();

        if (article) {
          return {
            content: article.textContent,
            metadata: {
              title: article.title,
              byline: article.byline,
              excerpt: article.excerpt,
              siteName: article.siteName,
              length: article.textContent.length,
              publishedTime: article.publishedTime
            }
          };
        }
      }

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
          return {
            content: element.innerText.trim(),
            metadata: {
              title: document.title,
              length: element.innerText.length
            }
          };
        }
      }
      
      const bodyText = document.body.innerText.trim();
      return {
        content: bodyText,
        metadata: {
          title: document.title,
          length: bodyText.length
        }
      };
    } catch (error) {
      console.error('Extraction error:', error);
      return {
        content: document.body.innerText.trim(),
        metadata: { title: document.title }
      };
    }
  }

  const chunkText = (text, maxChunkSize = 4000) => {
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
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

      if (isExtractButtonClicked) {
        setResult('📄 Summarizing full page content...');

        const chunks = chunkText(text, 4000);
        console.log(`📊 Split into ${chunks.length} chunks`);

        const chunkSummaries = [];

        for (let i = 0; i < chunks.length; i++) {
          setResult(`🔄 Processing section ${i + 1}/${chunks.length}...`);

          isExtractButtonClicked = false;
          const chunkSummary = await summarizeText(chunks[i]);
          isExtractButtonClicked = true;

          const cleanSummary = chunkSummary
            .replace(/\*\*Summary.*?\*\*\n\n/g, '')
            .trim();

          chunkSummaries.push(cleanSummary);
        }

        setResult('✨ Combining all section summaries...');
        const combinedSummaries = chunkSummaries.join('\n\n');

        let finalSummary;
        if (combinedSummaries.split(/\s+/).length > 2000) {
          isExtractButtonClicked = false;
          finalSummary = await summarizeText(combinedSummaries);
          isExtractButtonClicked = true;
        } else {
          finalSummary = combinedSummaries;
        }

        const result = `**Full Page Summary (${detailLevel.charAt(0).toUpperCase() + detailLevel.slice(1)} - ${summaryMode === 'bullets' ? 'Bullet Points' : summaryMode === 'paragraph' ? 'Paragraph' : 'Q&A'})**\n\n${finalSummary}\n\n---\n*Processed ${chunks.length} sections*`;

        setResult(result);
        return result;
      }

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

      let summary = await summarizer.summarize(text, { outputLanguage: "en" });
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

  const translateText = async (text) => {
    try {
      if (!apiSupport.translator) throw new Error('❌ Translator API not supported');
      if (!apiSupport.detect) throw new Error('❌ Language Detector API not supported');

      let sourceLang = translateFrom;
      let targetLang = translateTo;

      console.log("Translate from:", sourceLang, "to:", targetLang);

      let fromLang = sourceLang;

      if (sourceLang === 'auto') {
        console.log('🔍 Detecting language...');
        const detector = await LanguageDetector.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              const percent = Math.round((e.loaded / e.total) * 100);
              console.log(`Downloading language detector: ${percent}%`);
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

      const translator = await Translator.create({
        sourceLanguage: fromLang,
        targetLanguage: targetLang,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const percent = Math.round((e.loaded / e.total) * 100);
            console.log(`Downloading model: ${percent}% (${e.loaded}/${e.total})`);
          });
        }
      });

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
      const prompt = `
        As a professional research assistant, please provide an in-depth analysis:

        Text: "${text}"

        Please provide:
        1. Core Insight - A paragraph summarizing the most important findings
        2. Context - Detailed historical/academic background
        3. Key Concept - Explanation of technical terms and complex concepts
        4. Modern Relevance - Connections to current trends or issues
        5. Resource Guide - Recommendations to authoritative learning resources (please provide authentic references and URL links)

        Emphasis on accuracy and depth, suitable for professional readers.
        not need to add the ** ** or * * text.
    `;

      const result = await gemini_model.generateContent(prompt);
      const responseText = await result.response.text();
      
      return responseText;
    } else {
      if (!apiSupport.prompt) {
        throw new Error('❌ Prompt API not available for explanation generation');
      }

      const prompt = `
        Please explain the following in simple, clear language:

        "${text}"

        Please include:
        1. Overview of core content
        2. Background and context analysis
        3. Detailed explanation of key points
        4. Relevant impact or significance
        5. Suggested directions for further study

        Use a friendly, understandable tone, as if you were explaining something to a friend.
        not need to add the ** ** or * * text.
      `;

      const session = await LanguageModel.create({
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            console.log(`Downloaded explanation language model: ${e.loaded * 100}%`);
          });
        },
      });

      const explanation = await session.prompt(prompt);

      return explanation;
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
      const needCloudMixing = (
        text.toLowerCase().includes('latest') ||
        text.includes('2024') ||
        text.includes('2025') ||
        text.toLowerCase().includes('currently') ||
        text.toLowerCase().includes('realtime') ||
        text.toLowerCase().includes('forecast') ||
        text.toLowerCase().includes('prediction') ||
        text.toLowerCase().includes('trend')
      );

      let useOnlineModel = false;

      if (needCloudMixing && !deepThinkEnabled) {
        const approve = window.confirm("⚡ This question may require the online model for accurate and real-time info. Do you want to switch to online mode?");
        if (approve) {
          useOnlineModel = true;
        }
      } else if (deepThinkEnabled) {
        useOnlineModel = true;
      }

      let chatbot;
      let sourceTag;

      if (useOnlineModel) {
        chatbot = {
          async prompt(text) {
            const result = await gemini_model.generateContent(text);
            return result.response.text();
          }
        };
        sourceTag = "online";
      } else {
        chatbot = await LanguageModel.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              const percent = Math.round((e.loaded / e.total) * 100);
              console.log(`Downloading local chatbot model: ${percent}%`);
            });
          }
        });
        sourceTag = "local";
      }

      const userMessage = { type: 'user', content: text, timestamp: Date.now() };
      setChatHistory(prev => [...prev, userMessage]);

      const response = await chatbot.prompt(text);

      const botMessage = { type: 'bot', content: response, source: sourceTag, timestamp: Date.now() };
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

  const generateRelatedConcepts = async (text) => {
    if (!apiSupport.prompt) {
      throw new Error('❌ Prompt API not available for explanation generation');
    }

    const prompt = `
      Extract 3-5 core concepts from the following text and provide a brief explanation of each concept:

      Text: "${text}"

      Format:

      Concept 1: Short Definition → Related Aspect 1 → Related Aspect 2

      Concept 2: Short Definition → Related Aspect 1 → Related Aspect 2

      Keep it concise; each concept should have no more than three related aspects.
      no need add **bold** or *italic* text. also no need say here are 5 core concepts.
      directly start from concept 1 to concept 5 and each conecpt have gap space.
      not need to add the ** ** or * * text.
    `;

    const session = await LanguageModel.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log(`Downloaded Prompts language model: ${e.loaded * 100}%`);
        });
      },
    });

    const response = await session.prompt(prompt);
    const output = typeof response === "string" ? response : response.output?.[0]?.content?.[0]?.text || "";

    return output.trim();
  }

  const performQuickAnalysis = (text) => {
    if (!text || text.trim() === "") {
      return {
        charCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        readingTime: 0,
        textType: "Unknown",
        entities: [],
        difficulty: "N/A"
      };
    }

    const charCount = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    
    const paragraphs = text.split(/\n\n+|\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    
    const readingTime = Math.ceil(wordCount / 225);

    const textType = detectTextType(text, wordCount);

    const entities = extractEntities(text);

    const difficulty = assessDifficulty(text, wordCount, sentenceCount);

    return {
      charCount,
      wordCount,
      sentenceCount,
      paragraphCount,
      readingTime,
      textType,
      entities,
      difficulty
    };
  };

  const detectTextType = (text, wordCount) => {
    const lowerText = text.toLowerCase();
    
    if (/function|const|let|var|class|import|export|return/.test(text) || 
        /[{}();]/.test(text) && text.split('\n').length > 3) {
      return "Code/Technical";
    }
    
    if (/therefore|however|furthermore|moreover|consequently|thus|hence/.test(lowerText)) {
      return "Academic/Formal";
    }
    
    if (/once upon|suddenly|finally|meanwhile|story|chapter/.test(lowerText)) {
      return "Narrative/Story";
    }
    
    if (/step|first|second|how to|tutorial|guide|instructions/.test(lowerText)) {
      return "Instructional";
    }
    
    if (/\?|\!|hey|wow|cool|awesome|i think|i feel/.test(lowerText)) {
      return "Conversational";
    }
    
    return wordCount < 50 ? "Short note" : "General text";
  };

  const extractEntities = (text) => {
    const words = text.split(/\s+/);
    const entities = new Set();
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[.,!?;:()""']/g, '');
      
      if (/^[A-Z][a-z]+/.test(cleanWord) && cleanWord.length > 2) {
        const commonWords = ['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'I'];
        if (!commonWords.includes(cleanWord)) {
          entities.add(cleanWord);
        }
      }
    });
    
    return Array.from(entities).slice(0, 5);
  };

  const assessDifficulty = (text, wordCount, sentenceCount) => {
    if (wordCount === 0 || sentenceCount === 0) return "N/A";
    
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    const words = text.split(/\s+/);
    const complexWords = words.filter(word => estimateSyllables(word) >= 3).length;
    const complexWordRatio = complexWords / wordCount;
    
    let score = 0;
    
    if (avgWordsPerSentence > 20) score += 2;
    else if (avgWordsPerSentence > 15) score += 1;
    
    if (complexWordRatio > 0.2) score += 2;
    else if (complexWordRatio > 0.1) score += 1;
    
    if (score >= 3) return "Advanced";
    if (score >= 2) return "Intermediate";
    return "Basic";
  };

  const estimateSyllables = (word) => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    const vowels = word.match(/[aeiouy]+/g);
    return vowels ? vowels.length : 1;
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

      try {
        const concepts = await generateRelatedConcepts(selectedText || text);
        setRelatedConcepts(concepts);
      } catch (err) {
        setRelatedConcepts("❌ Failed to generate related concepts.");
      }
      
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
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-50">From</label>
                <select
                  value={translateFrom}
                  onChange={(e) => setTranslateFrom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm dark:text-white dark:bg-gray-800 dark:border-gray-700"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-50">To</label>
                <select
                  value={translateTo}
                  onChange={(e) => setTranslateTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm dark:text-white dark:bg-gray-800 dark:border-gray-700"
                >
                  {languages.filter(l => l.code !== 'auto').map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* <div className={`text-xs p-2 rounded ${apiSupport.translator ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {apiSupport.translator ? '✅ Using Chrome Translator API' : '⚠️ Using fallback translation'}
            </div> */}
          </div>
        );
      
      case 'explain':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200 p-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        deepExplain ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      {deepExplain ? '🌐' : '💎'}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {deepExplain ? 'Deep Explanation' : 'Quick Explanation'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {deepExplain ? 'Online - Comprehensive analysis' : 'Local - Fast explanation'}
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
            <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700 cursor-pointer">
              <button
                onClick={() => setShowSummarySettings(!showSummarySettings)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between dark:bg-gray-800 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-2 dark:bg-gray-800">
                  <span className="text-sm">🔍︎</span>
                  <span className="font-medium text-gray-800 dark:text-white">Result</span>
                  <span className="text-xs text-gray-500 dark:text-white">
                    {summaryMode === 'bullets' ? 'Bullets' : summaryMode === 'paragraph' ? 'Paragraph' : 'Q&A'} · {detailLevel}
                  </span>
                </div>
                <span className={`text-gray-400 transition-transform duration-200 dark:text-gray-50 ${showSummarySettings ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showSummarySettings && (
                <div className="p-3 bg-white border-t border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 dark:bg-gray-800 dark:border-gray-700 ">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">Summary Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bullets', label: 'Bullets', icon: '•' },
                        { id: 'paragraph', label: 'Paragraph', icon: '¶' },
                        { id: 'qa', label: 'Q&A', icon: '?' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setSummaryMode(mode.id)}
                          className={`p-2 rounded border text-xs font-medium transition-colors duration-200 cursor-pointer ${
                            summaryMode === mode.id
                              ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="mr-1 dark:text-white"> {mode.icon} </span>
                          <span className="dark:text-white"> {mode.label} </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">Detail Level</label>
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
                            className="mr-2 text-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-white">{level.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* <div className={`text-xs p-2 rounded ${apiSupport.summarizer ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {apiSupport.summarizer ? '✅ Using Chrome Summarizer API' : '⚠️ Using fallback summarization'}
            </div> */}
          </div>
        );
      
      case 'chat':
        return (
          <div className="flex flex-col h-[668px] overflow-y-hidden space-y-4">
            <div className="flex items-center justify-between rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <span>Readbuddy AI Assistant</span>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {apiSupport.chatbot ? 'Ready to chat' : 'Chatbot unavailable'}
                </p>
              </h3>
              {chatHistory.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="text-xs text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-400 px-2 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Start a conversation with the AI assistant</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                    Ask questions, request explanations, or just chat!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-purple-500 text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>

                        {message.type === 'user' && ( 
                          <p
                            className={`text-xs mt-1 ${
                              message.type === 'user'
                                ? 'text-purple-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        )}

                        {message.type !== 'user' && ( 
                          <p
                            className={`text-xs mt-1 ${
                              message.type === 'user'
                                ? 'text-purple-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()} · {message.source || "local"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-3 rounded-lg rounded-bl-none">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            AI is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={endOfMessagesRef} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex space-x-2 overflow-x-auto">
                {selectedText.trim() && (
                  <button
                    onClick={() => setCurrentMessage(selectedText.trim())}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center space-x-1"
                  >
                    <span>📄</span>
                    <span>Paste Text</span>
                  </button>
                )}

                <button
                  onClick={extractPageContent}
                  className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center space-x-1"
                >
                  <span>📖</span>
                  <span>Read Page</span>
                </button>

                <button
                  onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                  className={`px-3 py-2 text-xs rounded-md flex items-center space-x-1 transition-colors ${
                    deepThinkEnabled
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>🧠</span>
                  <span>DeepThink</span>
                </button>
              </div>

              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    placeholder="Type your message... (Press Enter to send)"
                    className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                    rows="2"
                    disabled={!apiSupport.chatbot || isStreaming}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!currentMessage.trim() || !apiSupport.chatbot || isStreaming}
                    className="absolute right-2 bottom-2 p-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen overflow-hidden bg-white dark:bg-gray-900 flex flex-col relative pb-20">
      {/* {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-50 dark:bg-blue-900 bg-opacity-95 flex items-center justify-center animate-in fade-in duration-200">
          <div className="border-4 border-dashed border-blue-400 rounded-2xl p-12 bg-white dark:bg-gray-800 shadow-lg animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">📄</div>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Drop Here</h3>
              <p className="text-sm text-blue-500 dark:text-blue-300">
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
      )} */}

      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 fixed top-0 left-0 right-0 z-50">
        <div className="relative grid grid-cols-4 gap-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          <div 
            className="absolute top-1 bottom-1 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 ease-out"
            style={{
              left: `calc(${tabs.findIndex(t => t.id === activeTab)} * 25% + 0.125rem)`,
              width: 'calc(25% - 0.25rem)'
            }}
          />
          
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActivePanel(null);
              }}
              className={`relative flex flex-col items-center py-2 px-1 rounded-md text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id 
                  ? 'text-gray-900 dark:text-white z-10' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
      <div className="flex-1 pt-25 p-4 overflow-y-auto bg-white dark:bg-gray-900">
        {activeTab !== 'chat' && (
          <div className="mb-4 relative">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <span>Selected Text</span>
              {selectedText && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  {selectedText.length} characters
                </span>
              )}

              {['summarize', 'translate', 'explain'].includes(activeTab) && !selectedText.trim() && (
                <button
                  onClick={extractPageContent}
                  className="absolute top-[-3.5] right-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                >
                  Extract Page Content
                </button>
              )}
            </h3>

            <div className="relative">
              <textarea
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                placeholder="Paste text here, or drag and drop content from any webpage or PDF file..."
                className="w-full h-40 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        <div className="min-h-auto">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderTabContent()}
          </div>
        </div>

        {/* Action Button */}
        {activeTab !== 'chat' && (
          <button
            onClick={() => processText(activeTab, selectedText)}
            disabled={isLoading || !selectedText.trim()}
            className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none ${
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
        )}

        {/* Results with Animation */}
        {activeTab !== 'chat' && result && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Result</h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {result}
              </div>
            </div>
              <div className="flex items-center gap-2 mt-3">
                {(activeTab === 'summarize' || activeTab === 'explain') && (
                  <>
                  <button 
                    onClick={() => setActivePanel(activePanel === "analysis" ? null : "analysis")}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    📊 Concise analysis
                  </button>
                  <button 
                    onClick={() => setActivePanel(activePanel === "related" ? null : "related")}
                    className="px-3 py-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                  >
                    🔗 Related topic
                  </button>
                </>
                )}
                <button 
                  onClick={() => setActivePanel(activePanel === "save" ? null : "save")}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  💾 Save
                </button>
              </div>

              {activePanel === "analysis" && (
                <div className="mt-3 p-4 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <h3 className="font-semibold text-lg mb-2 text-black dark:text-white">📊 Text Analysis Report</h3>
                  
                  {(() => {
                    const analysis = performQuickAnalysis(selectedText);

                    return (
                      <>
                        <p className="text-sm text-black dark:text-white">📝 <b>Basic Info</b></p>
                        <ul className="text-sm ml-4 list-disc text-black dark:text-white">
                          <li>Characters: {analysis.charCount}</li>
                          <li>Sentences: {analysis.sentenceCount}</li>
                          <li>Paragraphs: {analysis.paragraphCount}</li>
                          <li>Reading time: ~{analysis.readingTime} min</li>
                        </ul>

                        <p className="text-sm mt-2 text-black dark:text-white">🎯 <b>Content Features</b></p>
                        <ul className="text-sm ml-4 list-disc text-black dark:text-white">
                          <li>Text type: {analysis.textType}</li>
                          <li>Key entities: {analysis.entities.join(", ") || "None detected"}</li>
                        </ul>

                        <p className="text-sm mt-2 text-black dark:text-white">🔍 <b>Reading Suggestion</b></p>
                        <ul className="text-sm ml-4 list-disc text-black dark:text-white">
                          <li>Audience: Students / General readers</li>
                          <li>Difficulty: {analysis.difficulty}</li>
                        </ul>
                      </>
                    );
                  })()}
                </div>
              )}

                {activePanel === "save" && (
                  <div className="mt-3 p-4 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    <p className="font-semibold text-lg mb-3 text-black dark:text-white">💾 Save Notes</p>

                    {/* Title */}
                    <label className="block text-sm mb-1 text-black dark:text-white">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title..."
                      className="w-full px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 text-black dark:text-white mb-3"
                    />

                    {/* NoteSpace */}
                    {/* <label className="block text-sm mb-1 text-black dark:text-white">
                      NoteSpace <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 mb-3">
                      <select
                        value={selectedNoteSpace}
                        onChange={(e) => setSelectedNoteSpace(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
                      >
                        <option value="">-- Select a NoteSpace --</option>
                        {noteSpaces.map((space, idx) => (
                          <option key={idx} value={space}>{space}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const newSpace = prompt("Enter new NoteSpace name:");
                          if (newSpace && !noteSpaces.includes(newSpace)) {
                            setNoteSpaces([...noteSpaces, newSpace]);
                            setSelectedNoteSpace(newSpace);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        + Create
                      </button>
                    </div> */}

                    <label className="block text-sm mb-1 text-black dark:text-white">
                      Tags
                    </label>
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter a tag..."
                          className="flex-1 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                        <button
                          onClick={() => {
                            if (newCategory.trim()) {
                              setCategories([...categories, newCategory.trim()]);
                              setNewCategory("");
                            }
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Favorite */}
                    <label className="block text-sm mt-3 mb-1 text-black dark:text-white">
                      <input
                        type="checkbox"
                        checked={favorite}
                        onChange={(e) => setFavorite(e.target.checked)}
                        className="mr-2"
                      />
                      Mark as Favorite
                    </label>

                    <label className="block text-sm mt-2 mb-1 text-black dark:text-white">
                      <input
                        type="checkbox"
                        checked={readingLater}
                        onChange={(e) => setReadingLater(e.target.checked)}
                        className="mr-2"
                      />
                      Add to Reading Later
                    </label>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={confirmSave}
                        disabled={!title.trim()}
                        className={`px-3 py-1 text-xs rounded-md text-white ${
                          !title.trim()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setActivePanel(null)}
                        className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>

                    {showSavedMsg && (
                      <div className="mt-2 text-green-600 dark:text-green-400 text-sm">
                        ✅ Saved successfully!
                      </div>
                    )}
                  </div>
                )}

                {activePanel === "related" && (
                  <div className="mt-3 p-4 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    <h3 className="font-semibold text-lg mb-2 text-black dark:text-white">🔗 Related Concept Network</h3>

                    {loadingRelated ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300">⏳ Generating related concepts...</p>
                    ) : (
                      <div className="text-sm text-black dark:text-white whitespace-pre-line leading-relaxed">
                        {relatedConcepts || "No related concepts available."}
                      </div>
                    )}

                    <div className="flex gap-2 mt-6 text-black dark:text-white">
                      <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Explore More
                      </button>
                      <button className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700">
                        Add to Learning Path
                      </button>
                    </div>
                  </div>
                )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                (activeTab === 'explain' && deepExplain) || (activeTab == 'chat' && deepThinkEnabled) ? 'bg-blue-400' : 
                (activeTab === 'summarize' && apiSupport.summarizer) || (activeTab === 'translate' && apiSupport.translator) || (activeTab === 'explain' && apiSupport.prompt || (activeTab === 'chat' && apiSupport.chatbot)) ? 'bg-green-400' :
                'bg-yellow-400'
              }`}></div>
              <span>
                {(activeTab === 'explain' && deepExplain) || (activeTab == 'chat' && deepThinkEnabled) ? 'Online Processing' : 
                (activeTab === 'summarize' && apiSupport.summarizer) || (activeTab === 'translate' && apiSupport.translator) || (activeTab === 'explain' && apiSupport.prompt || (activeTab === 'chat' && apiSupport.chatbot)) ? ' Chrome API' :
                ' Fallback Mode'}
              </span>
              <span>
                {(activeTab === 'explain' && deepExplain) || (activeTab == 'chat' && deepThinkEnabled) ? '• Privacy Concerned' : '• Privacy Protected'}
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex justify-center gap-2">
              <button
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              >
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
                onClick={openSave}
                aria-label="Open save"
              >
                <Save className='w-4 h-4 text-gray-300 dark:text-gray-700 hover:cursor-pointer hover:text-green-600 transition-all'/>
              </button>
              <button
                onClick={openSettings}
                aria-label="Open settings"
              >
                <Settings className='w-4 h-4 text-gray-300 dark:text-gray-700 hover:cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-all'/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-slide-down-up z-50">
          {toastMsg}
        </div>
      )}

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

ReactDOM.createRoot(document.getElementById('root')).render(<SidePanel />)