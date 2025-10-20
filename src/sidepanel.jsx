import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Settings, Save, Info, Download, CircleAlert, ClipboardCopy } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { loadDarkMode, saveDarkMode, applyDarkMode } from './utils/darkMode';
import { marked } from "marked";
import DOMPurify from "dompurify";
import './index.css';
import DarkModeButton from './utils/darkModeBtn';

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
  const [pdfJsReady, setPdfJsReady] = useState(false);
  const pdfLibRef = useRef(null);

  const [tabResults, setTabResults] = useState({
    summarize: '',
    translate: '',
    explain: ''
  });
  const [tabRelatedConcepts, setTabRelatedConcepts] = useState({
    summarize: '',
    translate: '',
    explain: ''
  });
  const [tabMindmapData, setTabMindmapData] = useState({
    summarize: '',
    explain: ''
  });
  const [tabShowMindmap, setTabShowMindmap] = useState({
    summarize: false,
    explain: false
  });

  const [isPageContextLoaded, setIsPageContextLoaded] = useState(false);
  const [currentPageUrl, setCurrentPageUrl] = useState('');
  const [lastReadUrl, setLastReadUrl] = useState('');
  const [pageContext, setPageContext] = useState({ url: null, fullContent: null, metadata: null, summary: null, timestamp: null });
  const [pageHistory, setPageHistory] = useState([]); 
  const pageContextRef = useRef(null);
  const pageHistoryRef = useRef([]);
  const lastReadUrlRef = useRef('');
  const currentLoadIdRef = useRef(0);
  const [isTooltipTriggered, setIsTooltipTriggered] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [showAIGlow, setShowAIGlow] = useState(false);
  const [canExtractPage, setCanExtractPage] = useState(true);

  const [translateResults, setTranslateResults] = useState([]);
  const [currentTranslateIndex, setCurrentTranslateIndex] = useState(0);
  const [showAddLanguage, setShowAddLanguage] = useState(false);
  const [newTranslateTo, setNewTranslateTo] = useState('es'); 
  const [originalTextForTranslation, setOriginalTextForTranslation] = useState('');

  const [showMindmap, setShowMindmap] = useState(false);
  const [mindmapData, setMindmapData] = useState('');
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [mindmapTheme, setMindmapTheme] = useState(
    localStorage.getItem('mindmapTheme') || 'default'
  );
  const [showMindmapSettings, setShowMindmapSettings] = useState(false);

  const [processingQueue, setProcessingQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const processingQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);
  const MAX_PAGE_HISTORY = 20;
  const [chunkingDepth, setChunkingDepth] = useState({ current: 0, total: 0, level: 1 });
  const [userCancelledProcessing, setUserCancelledProcessing] = useState(false);
  const abortControllerRef = useRef(null);

  const[favorite, setFavorite] = useState(false);
  const [readingLater, setReadingLater] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [title, setTitle] = useState("");
  const [selectedNoteSpace, setSelectedNoteSpace] = useState(null);
  const [savedData, setSavedData] = useState(null);

  const PDF_URLS = {
    pdf: chrome.runtime.getURL('lib/pdf.mjs'),
    worker: chrome.runtime.getURL('lib/pdf.worker.mjs')
  };

  const isExtractableUrl = (url) => {
    if (!url) return false;

    const nonExtractablePatterns = [
      /^chrome:\/\//,
      /^chrome-extension:\/\//,
      /^about:/,
      /^edge:\/\//,
      /^brave:\/\//,
      /^opera:\/\//,
      /^vivaldi:\/\//,
      /^data:/,
      /^blob:/,
      /^javascript:/
    ];
    
    return !nonExtractablePatterns.some(pattern => pattern.test(url));
  };

  const [apiSupport, setApiSupport] = useState({
    summarizer: false,
    translator: false,
    detect: false,
    prompt: false,
    chatbot: false
  });

  let noteSpaces = []; 
  let isExtractButtonClicked = false;
  let pdfJsReadyPromise = null;
  const userCancelledRef = useRef(false);
  const isManualClick = useState(false);

  useEffect(() => {
    if (activeTab !== 'summarize' && activeTab !== 'explain') {
      setShowMindmap(false);
      setMindmapData('');
      setIsGeneratingMindmap(false);
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('mindmapTheme', mindmapTheme);
  }, [mindmapTheme]);

  useEffect(() => {
    checkAPISupport();

    const initializePageRead = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!isExtractableUrl(tab?.url)) {
            console.log('⚠️ Non-extractable URL detected:', tab?.url);
            setCanExtractPage(false);
            return;
          }
          setCanExtractPage(true);
        }

        console.log('🚀 Auto-reading page on app open');
        await checkAndLoadPageContext(false);
      } catch (error) {
        console.log('⚠️ Cannot read this page, ignoring:', error.message);
        setCanExtractPage(false);
      }
    };
    
    initializePageRead();
  }, []);

  useEffect(() => {
    const initMermaid = async () => {
      if (window.mermaid && window.mermaidInitialized) {
        console.log('✅ Mermaid already loaded and initialized');
        return;
      }

      if (window.mermaidLoading) {
        console.log('⏳ Mermaid is already loading...');
        return;
      }

      window.mermaidLoading = true;

      try {
        const existingScript = document.querySelector('script[data-mermaid-script]');
        if (existingScript) {
          console.log('🗑️ Removing existing Mermaid script');
          existingScript.remove();
        }

        console.log('📦 Loading Mermaid from local files...');
        
        const mermaidUrl = chrome.runtime.getURL('lib/mermaid.min.js');
        console.log('📂 Mermaid URL:', mermaidUrl);
        
        const script = document.createElement('script');
        script.src = mermaidUrl;
        script.setAttribute('data-mermaid-script', 'true');
        script.async = false;
        
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('✅ Mermaid script loaded from local file');
            
            if (window.mermaid) {
              try {
                window.mermaid.initialize({ 
                  startOnLoad: false,
                  theme: mindmapTheme, // Use saved theme preference
                  mindmap: {
                    padding: 20,
                    useMaxWidth: true
                  },
                  securityLevel: 'loose',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  logLevel: 'debug'
                });
                
                window.mermaidInitialized = true;
                window.mermaidLoading = false;
                console.log('✅ Mermaid initialized successfully');
                resolve();
              } catch (initError) {
                console.error('❌ Mermaid initialization error:', initError);
                reject(initError);
              }
            } else {
              const error = new Error('window.mermaid not available after script load');
              console.error('❌', error.message);
              reject(error);
            }
          };
          
          script.onerror = (error) => {
            console.error('❌ Failed to load Mermaid script:', error);
            window.mermaidLoading = false;
            reject(error);
          };
        });
        
        document.head.appendChild(script);
        await loadPromise;
        
      } catch (error) {
        console.error('❌ Error loading Mermaid:', error);
        window.mermaidLoading = false;
      }
    };

    initMermaid();
  }, [mindmapTheme]); 

  useEffect(() => {
    if (showMindmap && mindmapData && window.mermaid) {
      setTimeout(() => {
        window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
      }, 100);
    }
  }, [showMindmap, mindmapData, isDarkMode]);

  useEffect(() => {
    const initPDFJS = async () => {
      try {
        if (typeof window.pdfjsLib === 'undefined') {
          console.log('📚 Loading PDF.js...');
          
          const pdfjsModule = await import(chrome.runtime.getURL('lib/pdf.mjs'));
          window.pdfjsLib = pdfjsModule;
          
          if (window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              chrome.runtime.getURL('lib/pdf.worker.mjs');
          }
          
          setPdfJsReady(true);
          console.log('✅ PDF.js loaded successfully');
        } else {
          setPdfJsReady(true);
          console.log('✅ PDF.js already loaded');
        }
      } catch (error) {
        console.error('❌ Failed to load PDF.js:', error);
        const script = document.createElement('script');
        script.type = 'module';
        script.src = chrome.runtime.getURL('lib/pdf.mjs');
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              chrome.runtime.getURL('lib/pdf.worker.mjs');
            setPdfJsReady(true);
            console.log('✅ PDF.js loaded via fallback');
          }
        };
        document.head.appendChild(script);
      }
    };
    
    initPDFJS();
  }, []);

  useEffect(() => { 
    processingQueueRef.current = processingQueue; 
    console.log('📊 Queue ref updated, length:', processingQueue.length);
  }, [processingQueue]);

  useEffect(() => {
    window.checkQueue = () => {
      console.log('========== QUEUE STATUS ==========');
      console.log('Queue length:', processingQueueRef.current.length);
      console.log('Is processing:', isProcessingQueueRef.current);
      console.log('Queue items:', processingQueueRef.current);
      console.log('Page history size:', pageHistoryRef.current.length);
      console.log('Current page context loaded:', !!pageContextRef.current);
      console.log('==================================');
    };
  }, []);

  useEffect(() => {
    window.debugPDFJS = () => {
      console.log('=== PDF.js Debug Info ===');
      console.log('Ready:', pdfJsReady);
      console.log('Ref:', pdfLibRef.current ? 'Loaded' : 'Not loaded');
      console.log('Window:', window.pdfjsLib ? 'Available' : 'Not available');
      console.log('URLs:', {
        pdf: chrome.runtime.getURL('lib/pdf.mjs'),
        worker: chrome.runtime.getURL('lib/pdf.worker.mjs')
      });
      console.log('========================');
      
      return {
        ready: pdfJsReady,
        lib: pdfLibRef.current || window.pdfjsLib,
        urls: {
          pdf: chrome.runtime.getURL('lib/pdf.mjs'),
          worker: chrome.runtime.getURL('lib/pdf.worker.mjs')
        }
      };
    };
    
    if (pdfJsReady) {
      console.log('✅ PDF.js is ready for use');
    }
  }, [pdfJsReady]);


  // useEffect(() => {
  //   if (activeTab === 'chat' && !isPageContextLoaded) {
  //     readPageForChat();
  //   }
  // }, [activeTab]);

  useEffect(() => { pageContextRef.current = pageContext; }, [pageContext]);
  useEffect(() => { pageHistoryRef.current = pageHistory; }, [pageHistory]);
  useEffect(() => { lastReadUrlRef.current = lastReadUrl; }, [lastReadUrl]);
  useEffect(() => { processingQueueRef.current = processingQueue; }, [processingQueue]);

  useEffect(() => {
    if (activeTab === 'chat') {
      // setResult('');
    } else {
      setResult(tabResults[activeTab] || '');
      setRelatedConcepts(tabRelatedConcepts[activeTab] || '');
      
      if (activeTab === 'summarize' || activeTab === 'explain') {
        setMindmapData(tabMindmapData[activeTab] || '');
        setShowMindmap(tabShowMindmap[activeTab] || false);
      } else {
        setShowMindmap(false);
      }
    }

    const checkUrl = async () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!isExtractableUrl(tab?.url)) {
          setCanExtractPage(false);
          return;
        }
      }
      setCanExtractPage(true);
      checkAndLoadPageContext();
    };
    
    checkUrl();
  }, [activeTab]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const handleActivated = async (activeInfo) => {
        console.log('🔄 Tab switched, checking if need to read new page...');

        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!isExtractableUrl(tab?.url)) {
            console.log('⚠️ Non-extractable URL detected:', tab?.url);
            setCanExtractPage(false);
            return;
          }
          setCanExtractPage(true);
          await checkAndLoadPageContext(false);
        } catch (error) {
          console.log('⚠️ Cannot read this page, ignoring:', error.message);
          setCanExtractPage(false);
        }
      };

      chrome.tabs.onActivated.addListener(handleActivated);
      return () => chrome.tabs.onActivated.removeListener(handleActivated);
    }
  }, [activeTab]);

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
    const loadPDFJS = async () => {
      try {
        console.log('📚 Loading PDF.js from local files...');
        
        try {
          const pdfUrl = chrome.runtime.getURL('lib/pdf.mjs');
          const workerUrl = chrome.runtime.getURL('lib/pdf.worker.mjs');
          
          console.log('📦 PDF.js URL:', pdfUrl);
          console.log('📦 Worker URL:', workerUrl);
          
          const pdfjsLib = await import(pdfUrl);
          
          if (pdfjsLib.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          }
          
          pdfLibRef.current = pdfjsLib;
          window.pdfjsLib = pdfjsLib;
          
          setPdfJsReady(true);
          console.log('✅ PDF.js loaded via dynamic import');
          return;
          
        } catch (importError) {
          console.warn('⚠️ Dynamic import failed, trying script injection:', importError);
        }
        
        const script = document.createElement('script');
        script.type = 'module';
        
        const pdfUrl = chrome.runtime.getURL('lib/pdf.mjs');
        const workerUrl = chrome.runtime.getURL('lib/pdf.worker.mjs');
        
        script.textContent = `
          (async () => {
            try {
              const pdfjsModule = await import('${pdfUrl}');
              
              // Set worker
              if (pdfjsModule.GlobalWorkerOptions) {
                pdfjsModule.GlobalWorkerOptions.workerSrc = '${workerUrl}';
              }
              
              // Make globally available
              window.pdfjsLib = pdfjsModule;
              
              // Notify that it's loaded
              window.dispatchEvent(new CustomEvent('pdfjsready', { 
                detail: pdfjsModule 
              }));
              
              console.log('✅ PDF.js loaded and ready');
            } catch (err) {
              console.error('❌ Failed to load PDF.js:', err);
              window.dispatchEvent(new CustomEvent('pdfjserror', { 
                detail: err 
              }));
            }
          })();
        `;
        
        const loadPromise = new Promise((resolve, reject) => {
          const successHandler = (e) => {
            console.log('✅ PDF.js loaded successfully via script');
            pdfLibRef.current = e.detail;
            window.pdfjsLib = e.detail;
            setPdfJsReady(true);
            resolve(e.detail);
          };
          
          const errorHandler = (e) => {
            console.error('❌ PDF.js load error:', e.detail);
            reject(e.detail);
          };
          
          window.addEventListener('pdfjsready', successHandler, { once: true });
          window.addEventListener('pdfjserror', errorHandler, { once: true });
          
          setTimeout(() => {
            window.removeEventListener('pdfjsready', successHandler);
            window.removeEventListener('pdfjserror', errorHandler);
            
            if (window.pdfjsLib) {
              pdfLibRef.current = window.pdfjsLib;
              setPdfJsReady(true);
              resolve(window.pdfjsLib);
            } else {
              reject(new Error('PDF.js load timeout'));
            }
          }, 10000);
        });
        
        document.head.appendChild(script);
        await loadPromise;
        
      } catch (error) {
        console.error('❌ All PDF.js load methods failed:', error);
        console.log('💡 Trying fallback method...');
        
        try {
          const pdfUrl = chrome.runtime.getURL('lib/pdf.mjs');
          const workerUrl = chrome.runtime.getURL('lib/pdf.worker.mjs');
          
          const response = await fetch(pdfUrl);
          const code = await response.text();
          
          const blob = new Blob([code], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          
          const pdfjsModule = await import(blobUrl);
          
          if (pdfjsModule.GlobalWorkerOptions) {
            pdfjsModule.GlobalWorkerOptions.workerSrc = workerUrl;
          }
          
          pdfLibRef.current = pdfjsModule;
          window.pdfjsLib = pdfjsModule;
          setPdfJsReady(true);
          
          URL.revokeObjectURL(blobUrl);
          console.log('✅ PDF.js loaded via blob URL fallback');
          
        } catch (fallbackError) {
          console.error('❌ All loading methods exhausted:', fallbackError);
        }
      }
    };
    
    loadPDFJS();
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
          setIsTooltipTriggered(true);
          console.log("Tooltip triggered:", setIsTooltipTriggered);
          
          if (message.action !== 'chat') {
            console.log('[Sidebar] Auto-processing text for action:', message.action);
            
            const waitForAPI = setInterval(() => {
              const isReady = 
                (message.action === 'summarize' && apiSupport.summarizer) ||
                (message.action === 'translate' && apiSupport.translator) ||
                (message.action === 'explain' && apiSupport.prompt);
              
              if (isReady) {
                clearInterval(waitForAPI);
                processText(message.action, message.text, {});
              }
            }, 100);
            
            setTimeout(() => {
              clearInterval(waitForAPI);
              console.log('[Sidebar] API check timeout - processing anyway');
              processText(message.action, message.text, {});
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

  const MindmapViewer = ({ mermaidCode }) => {
    const [scale, setScale] = useState(1.2);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [svgContent, setSvgContent] = useState('');
    const [renderError, setRenderError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const renderAttemptRef = useRef(0);

    const themes = [
      { id: 'default', name: 'Default', preview: '🎨' },
      { id: 'dark', name: 'Dark', preview: '🌙' },
      { id: 'forest', name: 'Forest', preview: '🌲' },
      { id: 'neutral', name: 'Neutral', preview: '⚪' },
      { id: 'base', name: 'Base', preview: '📊' }
    ];

    useEffect(() => {
      const renderMermaid = async () => {
        renderAttemptRef.current += 1;
        const attemptId = renderAttemptRef.current;
        
        console.log(`🎨 Render attempt #${attemptId}`);
        
        if (!mermaidCode || !mermaidCode.trim()) {
          console.log('⚠️ No mermaidCode provided');
          setIsLoading(false);
          return;
        }

        console.log('⏳ Waiting for Mermaid to load...');
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!window.mermaid && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.mermaid) {
          console.error('❌ Mermaid failed to load');
          setRenderError('Mermaid library failed to load.');
          setIsLoading(false);
          return;
        }

        try {
          setSvgContent('');
          setRenderError(null);

          await window.mermaid.initialize({ 
            startOnLoad: false,
            theme: mindmapTheme,
            mindmap: {
              padding: 20,
              useMaxWidth: true
            },
            securityLevel: 'loose',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          });

          const id = `mindmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const renderResult = await window.mermaid.render(id, mermaidCode);
          const svg = renderResult.svg || renderResult;
          
          if (attemptId === renderAttemptRef.current) {
            setSvgContent(svg);
            setIsLoading(false);
            console.log('✅ SVG content set');
          }
          
        } catch (error) {
          console.error('❌ Render error:', error);
          setRenderError(error.message);
          setIsLoading(false);
        }
      };

      renderMermaid();
    }, [mermaidCode, mindmapTheme]);

    const downloadMindmap = (format) => {
      if (!svgContent) return;

      const svgElement = svgRef.current?.querySelector('svg');
      if (!svgElement) return;

      const clonedSvg = svgElement.cloneNode(true);
      
      const bbox = svgElement.getBBox();
      const padding = 40;
      
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
      clonedSvg.setAttribute('width', bbox.width + padding * 2);
      clonedSvg.setAttribute('height', bbox.height + padding * 2);
      
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);

      if (format === 'svg') {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmap-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          const scale = 3;
          canvas.width = (bbox.width + padding * 2) * scale;
          canvas.height = (bbox.height + padding * 2) * scale;
          
          ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `mindmap-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
            URL.revokeObjectURL(url);
          }, 'image/png', 1.0);
        };
        
        img.src = url;
      }
    };

    const copyMindmap = async () => {
      if (!svgContent) return;

      const svgElement = svgRef.current?.querySelector('svg');
      if (!svgElement) return;

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const bbox = svgElement.getBBox();
        const padding = 40;
        const scale = 2;
        
        const clonedSvg = svgElement.cloneNode(true);
        clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
        clonedSvg.setAttribute('width', bbox.width + padding * 2);
        clonedSvg.setAttribute('height', bbox.height + padding * 2);
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = async () => {
          canvas.width = (bbox.width + padding * 2) * scale;
          canvas.height = (bbox.height + padding * 2) * scale;
          
          ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(async (blob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              showToast('✅ Copied to clipboard!');
            } catch (err) {
              console.error('Failed to copy:', err);
              showToast('❌ Failed to copy');
            }
            URL.revokeObjectURL(url);
          }, 'image/png', 1.0);
        };
        
        img.src = url;
      } catch (error) {
        console.error('Copy failed:', error);
        showToast('❌ Copy not supported');
      }
    };

    const handleMouseDown = (e) => {
      if (!e.target.closest('button')) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y
        });
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const resetView = () => {
      setScale(1.2);
      setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, dragStart]);

    if (isLoading && !svgContent) {
      return (
        <div className="relative w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🧠</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rendering mindmap...</p>
            <div className="flex space-x-1 mt-2 justify-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg shadow-md text-xs text-center">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={() => setScale(s => Math.min(s + 0.2, 3))}
            className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium"
          >
            +
          </button>
          <button
            onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
            className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium"
          >
            ↻
          </button>
        </div>

        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={copyMindmap}
            className="p-2 mr-2 cursor-pointer bg-white dark:bg-gray-800 dark:hover:bg-gray-400 hover:bg-gray-400 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <ClipboardCopy className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white cursor-pointer  dark:bg-gray-800 dark:hover:bg-gray-400 hover:bg-gray-400  text-gray-700  dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {showSettings && (
            <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-4 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h4 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Mindmap Settings</h4>
              
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setMindmapTheme(theme.id);
                        setShowSettings(false);
                      }}
                      className={`px-3 py-2 text-xs rounded-md border transition-all ${
                        mindmapTheme === theme.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="mr-1">{theme.preview}</span>
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">Export</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadMindmap('png')}
                    className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    PNG
                  </button>
                  <button
                    onClick={() => downloadMindmap('svg')}
                    className="flex-1 px-3 py-2 text-xs bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-all flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    SVG
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div 
          className="absolute bottom-4 left-4 z-10 group"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <div className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md">
            <Info className="w-4 h-4" />
          </div>
          
          {showInfo && (
            <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 w-48 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span>🖱️</span>
                  <span>Drag to move</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>Use +/- to zoom</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>↻</span>
                  <span>Reset view</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className={`w-full h-full flex items-center justify-center p-8 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
        >
          <div
            ref={svgRef}
            className="mermaid-container"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
    );
  };

  const handleExtractPageContent = async () => {
    try {
      setIsLoading(true);
      setResult(''); 
      
      const cached = findCachedPage(currentPageUrl);
      if (cached && cached.fullContent) {
        console.log('✅ Loading content from page history cache');
        setSelectedText(cached.fullContent);
        setPageMetadata(cached.metadata);
        setIsLoading(false);
        return;
      }
      
      await extractPageContent(false);
      setIsTooltipTriggered(false);
    } catch (error) {
      console.error('❌ Error in handleExtractPageContent:', error);
      setIsLoading(false);
    }
  };

  const findCachedPage = (url) => {
    const hist = pageHistoryRef.current || [];
    return hist.find(p => p.url === url) || null;
  };

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
        result: activeTab === 'translate' && translateResults.length > 0 
          ? translateResults.map(t => t.result).join('\n\n---\n\n')
          : result,
        url: url,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        tags: categories,
        favorite: favorite,
        readingLater: readingLater,
        category: activeTab,
        date: new Date().toISOString().split('T')[0],
      ...(activeTab === 'translate' && translateResults.length > 0 && {
        translations: translateResults
      })
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

  useEffect(() => {
    if (activeTab === 'chat' && endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [activeTab]);

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


  const waitForPDFJS = async () => {
    if (window.pdfjsLib && window.pdfjsLib.getDocument) {
      return window.pdfjsLib;
    }

    if (!pdfJsReadyPromise) {
      pdfJsReadyPromise = new Promise(async (resolve, reject) => {
        try {
          console.log("📚 Loading PDF.js...");
          const pdfjsModule = await import(chrome.runtime.getURL("lib/pdf.mjs"));
          pdfjsModule.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.mjs");
          window.pdfjsLib = pdfjsModule;
          console.log("✅ PDF.js ready");
          resolve(pdfjsModule);
        } catch (err) {
          console.error("❌ Failed to load PDF.js:", err);
          reject(err);
        }
      });
    }

    return pdfJsReadyPromise;
  };

  const extractPageContent = async (forChatOnly = false) => {
    isExtractButtonClicked = !forChatOnly;

    try {
      setIsLoading(true);

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const isPDF = tab.url.toLowerCase().endsWith('.pdf') || 
                    tab.url.includes('pdf') ||
                    tab.title.toLowerCase().includes('.pdf');
      
        if (isPDF) {
          console.log('📄 Detected PDF, extracting text...');
          const pdfContent = await extractPDFContent(tab);
          
          if (pdfContent) {
            if (!forChatOnly) {
              setSelectedText(pdfContent.content);
              setPageMetadata(pdfContent.metadata);
            }
            setIsLoading(false);
            setCanExtractPage(true); 
            return pdfContent;
          }
        }

        const cacheKey = `page_${tab.id}_${tab.url}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          const { content, metadata, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('✅ Using cached content');
            
            if (!forChatOnly) {
              setSelectedText(content);
              setPageMetadata(metadata);
            }
            
            setIsLoading(false);
            setCanExtractPage(true);
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

          if (!forChatOnly) {
            setSelectedText(content);
            setPageMetadata(metadata);
          }
          
          console.log('📄 Extracted:', {
            title: metadata.title,
            length: content.length,
            words: content.split(/\s+/).length
          });

          setIsLoading(false);
          setCanExtractPage(true); 
          return { content, metadata };
        }
      }
    } catch (error) {
      console.error('❌ Error extracting page content:', error);
      setCanExtractPage(false);
      if (!forChatOnly) {
        setResult(`❌ Failed to extract: ${error.message}`);
      }
      setIsLoading(false);
      return null;
    }
  };

  const extractPDFContent = async (tab) => {
    try {
      console.log('🔍 Starting PDF extraction for tab:', tab.id);
      
      try {
        console.log('🔍 Attempting to extract from PDF viewer...');
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractPDFFromViewer
        });

        if (results && results[0] && results[0].result && 
            results[0].result.content && results[0].result.content.length > 100) {
          console.log('✅ Successfully extracted from PDF viewer');
          return results[0].result;
        }
      } catch (viewerError) {
        console.log('ℹ️ PDF viewer extraction not available:', viewerError.message);
      }

      if (!pdfJsReady) {
        console.log('⚠️ PDF.js not ready yet, waiting...');
        
        let attempts = 0;
        while (!pdfJsReady && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (!pdfJsReady) {
          throw new Error('PDF.js library is not ready. Please wait a moment and try again.');
        }

        console.log('✅ PDF.js is ready, proceeding with extraction');
      }
      
      console.log('🔄 Fetching PDF with PDF.js...');
      const pdfData = await fetchAndParsePDF(tab.url);
      
      if (pdfData && pdfData.content && pdfData.content.length > 0) {
        console.log('✅ Successfully extracted PDF with PDF.js');
        return pdfData;
      }

      console.warn('⚠️ Could not extract PDF content');
      return {
        content: '',
        metadata: {
          title: tab.title || 'PDF Document',
          note: 'Unable to extract text from this PDF. It may be:\n' +
                '• A scanned document (image-based)\n' +
                '• Password-protected\n' +
                '• A local file (file:// URLs cannot be fetched)\n' +
                '• An empty or corrupted PDF',
          type: 'PDF',
          suggestion: 'Try copying and pasting the text directly if visible.'
        }
      };
      
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      return {
        content: '',
        metadata: {
          title: 'Extraction Error',
          error: error.message,
          type: 'PDF'
        }
      };
    }
  };

  function extractPDFFromViewer() {
    try {
      const textLayers = document.querySelectorAll('.textLayer');
      if (textLayers.length > 0) {
        let fullText = '';
        textLayers.forEach(layer => {
          const spans = layer.querySelectorAll('span');
          spans.forEach(span => {
            fullText += span.textContent + ' ';
          });
          fullText += '\n\n';
        });
        
        if (fullText.trim()) {
          return {
            content: fullText.trim(),
            metadata: {
              title: document.title.replace('.pdf', ''),
              length: fullText.length,
              type: 'PDF'
            }
          };
        }
      }

      const embedElements = document.querySelectorAll('embed[type="application/pdf"]');
      if (embedElements.length > 0) {
        return {
          content: '',
          metadata: {
            title: document.title,
            note: 'PDF detected but text extraction not available. Please download and open in browser.',
            type: 'PDF'
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error in PDF viewer extraction:', error);
      return null;
    }
  }

  const fetchAndParsePDF = async (url) => {
    try {
      console.log('📄 Starting PDF extraction for:', url);
      
      let attempts = 0;
      const maxAttempts = 40;
      
      while (!pdfJsReady && attempts < maxAttempts) {
        console.log(`⏳ Waiting for PDF.js... (${attempts * 500}ms)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
       const pdfLib = await waitForPDFJS();
      
      if (!pdfLib) {
        throw new Error('PDF.js not available. Check console for loading errors.');
      }
      
      console.log('✅ PDF.js ready, starting extraction');
      
      // if (url.startsWith('file://')) {
      //   throw new Error('Cannot fetch local file:// URLs directly. Please open the PDF in Chrome first.');
      // }
      
      console.log('📥 Fetching PDF from:', url);
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('📦 PDF downloaded:', arrayBuffer.byteLength, 'bytes');
      
      if (arrayBuffer.byteLength < 100) {
        throw new Error('PDF file is too small or empty');
      }
      
      console.log('📖 Parsing PDF document...');
      const loadingTask = pdfLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        standardFontDataUrl: chrome.runtime.getURL('lib/')
      });
      
      const pdf = await loadingTask.promise;
      console.log(`✅ PDF loaded: ${pdf.numPages} pages`);
      
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 50);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          console.log(`📄 Extracting page ${pageNum}/${maxPages}...`);
          
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          let pageText = '';
          let lastY = null;
          
          textContent.items.forEach((item, index) => {
            const text = item.str;
            
            if (!text.trim()) return;
            
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
              pageText += '\n';
            }
            
            pageText += text;
            
            if (index < textContent.items.length - 1) {
              const nextItem = textContent.items[index + 1];
              const currentEnd = item.transform[4] + item.width;
              const nextStart = nextItem.transform[4];
              
              if (nextStart - currentEnd > 1) {
                pageText += ' ';
              }
            }
            
            lastY = item.transform[5];
          });
          
          fullText += pageText + '\n\n';
          
        } catch (pageError) {
          console.error(`❌ Failed to extract page ${pageNum}:`, pageError);
          fullText += `[Page ${pageNum} failed: ${pageError.message}]\n\n`;
        }
      }
      
      if (pdf.numPages > maxPages) {
        fullText += `\n[Note: Extracted ${maxPages} of ${pdf.numPages} pages]`;
      }
      
      const finalText = fullText.trim();
      
      console.log('✅ PDF extraction complete:', {
        pages: maxPages,
        totalPages: pdf.numPages,
        characters: finalText.length,
        words: finalText.split(/\s+/).length
      });
      
      if (finalText.length < 5) { 
        return {
          content: '',
          metadata: {
            title: url.split('/').pop().replace('.pdf', ''),
            pages: pdf.numPages,
            error: 'PDF appears to be empty or image-based (scanned)',
            type: 'PDF'
          }
        };
      }
      
      return {
        content: finalText,
        metadata: {
          title: url.split('/').pop().replace('.pdf', ''),
          pages: pdf.numPages,
          pagesExtracted: maxPages,
          length: finalText.length,
          words: finalText.split(/\s+/).length,
          type: 'PDF',
          url: url
        }
      };
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      
      return {
        content: '',
        metadata: {
          title: 'PDF Extraction Failed',
          error: error.message,
          note: error.message.includes('file://') 
            ? 'Local files cannot be accessed. Try opening the PDF in a Chrome tab first.'
            : 'Could not extract PDF content. It may be password-protected or corrupted.',
          type: 'PDF'
        }
      };
    }
  };

  function extractWithReadability() {
    try {
      console.log('🔍 Starting extraction with Readability...');
      const documentClone = document.cloneNode(true);
      
      if (typeof Readability !== 'undefined') {
        console.log('✅ Readability available, parsing...');
        const article = new Readability(documentClone, {
          debug: false,
          maxElemsToParse: 0,
          nbTopCandidates: 5,
          charThreshold: 500
        }).parse();

        if (article) {
          console.log('✅ Readability parsed article:', {
            title: article.title,
            contentLength: article.textContent?.length,
            excerpt: article.excerpt
          });
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
        } else {
          console.warn('⚠️ Readability returned null, trying fallback...');
        }
      } else {
        console.warn('⚠️ Readability not available, using fallback...');
      }

      // Fallback selectors
      const selectors = [
        'article',
        '[role="main"]',
        '.content',
        '.post-content', 
        '.entry-content',
        'main',
        '#content',
        '#mw-content-text' // Wikipedia specific
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
          console.log('✅ Found content with selector:', selector);
          const content = element.innerText.trim();
          console.log('📄 Content length:', content.length);
          return {
            content: content,
            metadata: {
              title: document.title,
              length: content.length
            }
          };
        }
      }
      
      console.log('⚠️ No selector matched, using body text');
      const bodyText = document.body.innerText.trim();
      console.log('📄 Body text length:', bodyText.length);
      return {
        content: bodyText,
        metadata: {
          title: document.title,
          length: bodyText.length
        }
      };
    } catch (error) {
      console.error('❌ Extraction error:', error);
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

  const checkAndLoadPageContext = async (prioritize = false) => {
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs) return;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;
      const url = tab.url;

      if (!isExtractableUrl(url)) {
        console.log('⚠️ Skipping non-extractable URL:', url);
        setCanExtractPage(false);
        return;
      }
      setCanExtractPage(true);

      console.log('🔍 Checking page context for:', url, 'Prioritize:', prioritize);

      setCurrentPageUrl(url);

      if (prioritize) {
        setIsLoading(true);
      }

      if (pageContextRef.current?.url === url) {
        setIsPageContextLoaded(true);
        if (prioritize) {
          setIsLoading(false);
        }
        console.log('✅ Page context already loaded for current URL');
        return;
      }

      const cachedPage = findCachedPage(url);
      if (cachedPage) {
        setPageContext(cachedPage);
        pageContextRef.current = cachedPage;
        setIsPageContextLoaded(true);
        if (prioritize) {
          setIsLoading(false);
        }
        console.log('✅ Using cached content for', url);
        return;
      }

      if (prioritize) {
        console.log('⚡ PRIORITY REQUEST - Interrupting queue for:', url);
        
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('🛑 Aborted previous processing');
        }
        
        abortControllerRef.current = new AbortController();
        
        isProcessingQueueRef.current = false;
        setIsProcessingQueue(false);
        
        const filteredQueue = processingQueueRef.current.filter(item => item.url !== url);
        
        const newQueue = [
          { url, timestamp: Date.now(), priority: true },
          ...filteredQueue
        ];
        
        setProcessingQueue(newQueue);
        processingQueueRef.current = newQueue;
        
        currentLoadIdRef.current++;
        if (activeTab === 'chat') {
          setIsLoading(true);
        }
        
        try {
          await readPageForChat(url, abortControllerRef.current.signal);
          setIsLoading(false);
          
          // Remove processed URL from queue
          const updatedQueue = processingQueueRef.current.filter(item => item.url !== url);
          setProcessingQueue(updatedQueue);
          processingQueueRef.current = updatedQueue;
          
          // Resume queue processing if there are remaining items
          if (updatedQueue.length > 0 && !isProcessingQueueRef.current) {
            setTimeout(() => processQueue(), 100);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('⚠️ Priority processing was aborted');
          }
          setIsLoading(false);
        }
        
      } else {
        const inQueue = processingQueueRef.current.some(item => item.url === url);
        
        if (!inQueue && url !== lastReadUrlRef.current) {
          console.log('📋 Adding to queue (background):', url);
          const newQueue = [...processingQueueRef.current, { url, timestamp: Date.now() }];
          setProcessingQueue(newQueue);
          processingQueueRef.current = newQueue;
          
          if (!isProcessingQueueRef.current) {
            setTimeout(() => processQueue(), 100);
          }
        }
      }
    } catch (err) {
      console.log('⚠️ Cannot read this page, ignoring:', err.message);
    }
  };

  const processQueue = async () => {
    if (isProcessingQueueRef.current) {
      console.log('⏳ Queue processor already running');
      return;
    }
    
    if (processingQueueRef.current.length === 0) {
      console.log('📭 Queue is empty, nothing to process');
      return;
    }

    console.log('🚀 Starting queue processor');
    setIsProcessingQueue(true);
    isProcessingQueueRef.current = true;
    
    while (processingQueueRef.current.length > 0) {
      // Check if we should stop (interrupted by priority request)
      if (!isProcessingQueueRef.current) {
        console.log('🛑 Queue processing interrupted');
        break;
      }
      
      const nextItem = processingQueueRef.current[0];
      console.log('📄 Processing queue item:', nextItem.url);
      console.log('📊 Remaining in queue:', processingQueueRef.current.length);
      
      const cached = findCachedPage(nextItem.url);
      if (cached) {
        console.log('✅ Already cached, skipping:', nextItem.url);
        setProcessingQueue(prev => prev.slice(1));
        continue;
      }
      
      const isCurrentPage = nextItem.url === currentPageUrl;
      
      try {
        console.log('⏳ Starting to read:', nextItem.url);
        
        // Create abort controller for this item
        const itemAbortController = new AbortController();
        abortControllerRef.current = itemAbortController;
        
        const result = await readPageForChat(nextItem.url, itemAbortController.signal);
        
        if (isCurrentPage && result) {
          console.log('✅ Updated current page context:', nextItem.url);
        }
        
        console.log('✅ Successfully read:', nextItem.url);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('🛑 Queue item processing was aborted:', nextItem.url);
          // Don't remove from queue, let priority handler manage it
          break;
        }
        console.log('⚠️ Cannot read page, skipping:', nextItem.url, error.message);
      }
      
      setProcessingQueue(prev => prev.slice(1));
      console.log('✅ Removed from queue:', nextItem.url);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    isProcessingQueueRef.current = false;
    setIsProcessingQueue(false);
    console.log('✅ Queue processing complete');
  };

  const generateTitleAndTags = async () => {
    setIsAIGenerating(true);
    setShowAIGlow(true);
    
    try {
      const contextText = `
        Selected Text: ${selectedText.substring(0, 500)}
        
        Result/Summary: ${result.substring(0, 500)}
      `;
      
      const prompt = `Based on the following content, generate a concise, descriptive title (max 60 characters) and 3-5 relevant tags.

        ${contextText}

        Respond in this exact JSON format:
        {
          "title": "Your Generated Title Here",
          "tags": ["tag1", "tag2", "tag3"]
        }

        Keep the title clear and informative. Tags should be single words or short phrases that categorize the content.`;

      const result_ai = await gemini_model.generateContent(prompt);
      const responseText = await result_ai.response.text();
      
      let cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const parsed = JSON.parse(cleanedResponse);
      
      setTitle(parsed.title || "");
      setCategories(parsed.tags || []);
      
      setTimeout(() => {
        setShowAIGlow(false);
      }, 2000);
      
    } catch (error) {
      console.error("AI generation error:", error);
      showToast("❌ Failed to generate title and tags");
      setShowAIGlow(false);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const generateMindmap = async () => {
    setIsGeneratingMindmap(true);
    
    try {
      const contentPreview = result.substring(0, 2000);
      
      const prompt = `Create a Mermaid mindmap diagram based on this content. Follow these rules EXACTLY:

      Content to analyze:
      ${contentPreview}

      CRITICAL FORMATTING RULES:
      1. Start with "mindmap" on the first line
      2. The root node MUST use double parentheses: root((Main Topic))
      3. Use proper indentation (2 or 4 spaces per level)
      4. Keep node labels SHORT (3-6 words maximum)
      5. Maximum 3 levels deep (root → main branches → sub-branches)
      6. Include 3-5 main branches
      7. Each main branch should have 2-4 sub-branches

      OUTPUT FORMAT (follow this structure):
      mindmap
        root((Central Idea))
          Main Branch 1
            Detail 1.1
            Detail 1.2
          Main Branch 2
            Detail 2.1
            Detail 2.2
          Main Branch 3
            Detail 3.1
            Detail 3.2

      IMPORTANT: 
      - Output ONLY the mindmap code
      - NO explanations before or after
      - NO markdown code blocks
      - NO extra text
      - Start directly with "mindmap"`;

      let response;
      if (deepExplain) {
        const result_ai = await gemini_model.generateContent(prompt);
        response = await result_ai.response.text();
      } else {
        const session = await LanguageModel.create();
        response = await session.prompt(prompt);
        session.destroy();
      }
      
      let cleanedMindmap = response
        .replace(/```mermaid\n?/g, "")
        .replace(/```\n?/g, "")
        .replace(/^[^m]*mindmap/i, 'mindmap')
        .trim();
      
      if (!cleanedMindmap.toLowerCase().startsWith('mindmap')) {
        cleanedMindmap = 'mindmap\n  root((Main Topic))\n' + cleanedMindmap;
      }
      
      console.log('Generated mindmap:', cleanedMindmap);
      setMindmapData(cleanedMindmap);
      setShowMindmap(true);

      setTabMindmapData(prev => ({
        ...prev,
        [activeTab]: cleanedMindmap
      }));
      setTabShowMindmap(prev => ({
        ...prev,
        [activeTab]: true
      }));
      
    } catch (error) {
      console.error('Mindmap generation error:', error);
      showToast("❌ Failed to generate mindmap");
      
      const fallbackMindmap = `mindmap
      root((${activeTab === 'summarize' ? 'Summary' : activeTab === 'explain' ? 'Explanation' : 'Content'}))
        Key Point 1
          Detail A
          Detail B
        Key Point 2
          Detail C
          Detail D
        Key Point 3
          Detail E
          Detail F`;
      
      setMindmapData(fallbackMindmap);
      setShowMindmap(true);

      setTabMindmapData(prev => ({
        ...prev,
        [activeTab]: fallbackMindmap
      }));
      setTabShowMindmap(prev => ({
        ...prev,
        [activeTab]: true
      }));
    } finally {
      setIsGeneratingMindmap(false);
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

  
  const summarizeText = async (text, depth = 1, maxDepth = 3) => {
    try {
      if (depth > 1 && userCancelledProcessing) {
        throw new Error('Processing cancelled by user');
      }

      if (!apiSupport.summarizer) {
        throw new Error('❌ Summarizer API not supported');
      }

      const detailConfig = {
        concise: { length: 'short' },
        standard: { length: 'medium' },
        detailed: { length: 'long' }
      };

      const formatConfig = {
        bullets: { type: 'key-points', output: 'markdown' },
        paragraph: { type: 'tldr', output: 'plain-text' },
        qa: { type: 'tldr', output: 'markdown' }
      };

      const config = detailConfig[detailLevel];
      const format = formatConfig[summaryMode];

      let summaryType = format.type;
      if (summaryMode === 'qa') summaryType = 'tldr';

      const wordCount = text.split(/\s+/).length;
      const needsChunking = text.length > 4000 || wordCount > 600;

      if (needsChunking || isExtractButtonClicked) {
        const chunks = chunkText(text, 3500);
        console.log(`📊 Split into ${chunks.length} chunks (Depth ${depth}/${maxDepth})`);

        if (depth === 1 && chunks.length > 10) {
          const estimatedTime = Math.ceil(chunks.length * 3 / 60);
          const userConfirmed = window.confirm(
            `⏱️ Large Content Detected!\n\n` +
            `This will process ${chunks.length} sections and may take approximately ${estimatedTime} minute${estimatedTime > 1 ? 's' : ''}.\n\n` +
            `Click OK to continue or Cancel to stop.\n\n` +
            `💡 Tip: For faster results, try selecting smaller portions of text.`
          );

          if (!userConfirmed) {
            setUserCancelledProcessing(true);
            userCancelledRef.current = true;

            const recommendation = `❌ Processing cancelled.\n\n` +
              `**Recommendations:**\n` +
              `• Select a smaller portion of the page (e.g., specific sections or paragraphs)\n` +
              `• Use the browser's "Find" feature (Ctrl/Cmd+F) to locate specific content\n` +
              `• Try summarizing one section at a time for better control\n` +
              `• Consider using "Concise" detail level for faster processing\n\n` +
              `**Current text size:** ${text.length.toLocaleString()} characters, ${wordCount.toLocaleString()} words`;
            setResult(recommendation);
            setIsLoading(false);
            // return recommendation;

            throw new Error('User cancelled processing');
          }
        }

        setChunkingDepth({ current: depth, total: maxDepth, level: chunks.length });

        const chunkSummaries = [];

        for (let i = 0; i < chunks.length; i++) {
          if (userCancelledProcessing) {
            throw new Error('Processing cancelled by user');
          }

          const progressText = depth > 1 
            ? `📄 Processing section ${i + 1}/${chunks.length}... (${depth}/${maxDepth})`
            : `📄 Processing section ${i + 1}/${chunks.length}...`;
          setResult(progressText);

          const tempExtractFlag = isExtractButtonClicked;
          isExtractButtonClicked = false;
          
          try {
            const chunkSummary = await summarizeText(chunks[i], depth + 1, maxDepth);
            
            let cleanSummary = chunkSummary;
            
            if (summaryMode !== 'bullets') {
              cleanSummary = cleanSummary.replace(/^\s*•\s*/gm, '');
            }

            cleanSummary = cleanSummary
              .replace(/\*\*Summary.*?\*\*\n\n/g, '')
              .replace(/\*\*Full Content Summary.*?\*\*\n\n/g, '')
              .replace(/---\n\*Processed \d+ sections\*/g, '')
              .trim();
            
            chunkSummaries.push(cleanSummary);
          } catch (chunkError) {
            console.error(`Error processing chunk ${i + 1}:`, chunkError);
            if (chunkError.message === 'Processing cancelled by user') {
              throw chunkError;
            }
            const sentences = chunks[i].split(/[.!?]+/).filter(s => s.trim().length > 10);
            const fallbackSummary = sentences.slice(0, 3).join('. ') + '.';
            chunkSummaries.push(fallbackSummary);
          }
          
          isExtractButtonClicked = tempExtractFlag;
        }

        setResult('✨ Combining all section summaries...');
        
        let combinedSummaries;
        combinedSummaries = chunkSummaries.join('\n\n');

        let finalSummary;
        if (combinedSummaries.split(/\s+/).length > 1500 && depth < maxDepth) {
          isExtractButtonClicked = false;
          try {
            finalSummary = await summarizeText(combinedSummaries, depth + 1, maxDepth);
            finalSummary = finalSummary
              .replace(/\*\*Summary.*?\*\*\n\n/g, '')
              .replace(/\*\*Full Content Summary.*?\*\*\n\n/g, '')
              .replace(/---\n\*Processed \d+ sections\*/g, '')
              .trim();
          } catch (finalError) {
            console.error('Error in final summarization:', finalError);
            if (finalError.message === 'Processing cancelled by user') {
              throw finalError;
            }
            finalSummary = combinedSummaries;
          }
          isExtractButtonClicked = true;
        } else {
          finalSummary = combinedSummaries;
        }

        if (depth === 1) {
          let displaySummary = finalSummary;
  
          if (summaryMode === 'qa') {
            const qaMatches = displaySummary.match(/(Q\d+:[\s\S]*?A\d+:[\s\S]*?)(?=Q\d+:|$)/g);
            if (qaMatches && qaMatches.length > 5) {
              displaySummary = qaMatches.slice(0, 5).join('\n\n');
            }
          }

          const result = `**Full Content Summary (${detailLevel.charAt(0).toUpperCase() + detailLevel.slice(1)} - ${summaryMode === 'bullets' ? 'Bullet Points' : summaryMode === 'paragraph' ? 'Paragraph' : 'Q&A'})**\n\n${finalSummary}\n\n---\n*Processed ${chunks.length} sections*`;
          setResult(result);
          setUserCancelledProcessing(false);
          return result;
        } else {
          return finalSummary;
        }
      }

      const summarizer = await Summarizer.create({
        type: format.type,
        format: format.output,
        length: config.length,
        outputLanguage: 'en',
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

        const qaPrompt = depth === 1 
          ? `Based on the following summary, generate EXACTLY 5 detailed Q&A pairs.
            - Cover background, reasoning, implications, and author's perspective.
            - Keep answers concise but informative.
            - Number them Q1-Q5 and A1-A5.
            
            Summary: "${summary}"
            
            Format:
            Q1: ...
            A1: ...
            Q2: ...
            A2: ...
            ...
            Q5: ...
            A5: ...`
          : `Based on the following summary, generate EXACTLY 2 key Q&A pairs (for combining later).
            - Focus on the most important points only.
            - Keep answers brief.
            
            Summary: "${summary}"
            
            Format:
            Q: ...
            A: ...`;

        const prompt = qaPrompt;

        const session = await LanguageModel.create();
        const extraQA = await session.prompt(prompt);

        if (depth === 1) {
          let cleanQA = extraQA
            .replace(/\*\*In-Depth Q&A.*?\*\*\n*/g, '')
            .replace(/Here are \d+ detailed Q&A pairs.*?\n*/g, '')
            .trim();
          
          const qaMatches = cleanQA.match(/(Q\d+:[\s\S]*?A\d+:[\s\S]*?)(?=Q\d+:|$)/g);
          if (qaMatches && qaMatches.length > 5) {
            cleanQA = qaMatches.slice(0, 5).join('\n\n');
          }
          
          summary = `**Q&A Summary:**\n\n${cleanQA}`;
        } else {
          const lastQMatch = result?.match(/Q(\d+):/g);
          let lastQNum = 0;
          if (lastQMatch) {
            const numbers = lastQMatch.map(q => parseInt(q.match(/\d+/)[0]));
            lastQNum = Math.max(...numbers);
          }

          let nextQNum = lastQNum;
          summary = extraQA.replace(/Q(\d+):/g, () => {
            nextQNum += 1;
            return `Q${nextQNum}:`;
          });

          summary = extraQA
              .replace(/\*\*In-Depth Q&A.*?\*\*\n*/g, '')
              .replace(/Here are \d+ detailed Q&A pairs.*?\n*/g, '')
              .replace(/Q:/g, 'Q:')  // Keep simple format
              .trim();
        }
        session.destroy();
      }

      if (depth === 1) {
        return `**Summary (${detailLevel.charAt(0).toUpperCase() + detailLevel.slice(1)} - ${summaryMode === 'bullets' ? 'Bullet Points' : summaryMode === 'paragraph' ? 'Paragraph' : 'Q&A'}):**\n\n${summary}`;
      } else {
        return summary;
      }

    } catch (error) {
      console.error('⚠️ Summarizer API error:', error);

      if (error.message === 'Processing cancelled by user') {
        throw error;
      }

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
          // monitor(m) {
          //   m.addEventListener('downloadprogress', (e) => {
          //     const percent = Math.round((e.loaded / e.total) * 100);
          //     console.log(`Downloading language detector: ${percent}%`);
          //   });
          // }
        });
        const result = await detector.detect(text);
        fromLang = result[0]?.detectedLanguage || 'en';
        detector.destroy();
        console.log(`✅ Detected language: ${fromLang}`);
      }

      if (fromLang === targetLang) {
        return `Text is already in target language (${targetLang.toUpperCase()}):\n\n${text}`;
      }

      const paragraphs = text.split(/\n\n+/);

      const translator = await Translator.create({
        sourceLanguage: fromLang,
        targetLanguage: targetLang,
        // monitor(m) {
        //   m.addEventListener('downloadprogress', (e) => {
        //     const percent = Math.round((e.loaded / e.total) * 100);
        //     console.log(`Downloading model: ${percent}% (${e.loaded}/${e.total})`);
        //   });
        // }
      });

      const translatedParagraphs = [];
      for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (trimmedParagraph) {
          try {
            const translated = await translator.translate(trimmedParagraph);
            translatedParagraphs.push(translated);
          } catch (error) {
            console.error('Translation error for paragraph:', error);
            translatedParagraphs.push(trimmedParagraph);
          }
        } else {
          translatedParagraphs.push(''); 
        }
      }

      translator.destroy();

      const translation = translatedParagraphs.join('\n\n');

      const fromLangName = languages.find(l => l.code === fromLang)?.name || fromLang.toUpperCase();
      const toLangName = languages.find(l => l.code === targetLang)?.name || targetLang.toUpperCase();

      return `**Translation (${fromLangName} → ${toLangName}):**\n\n${translation}`;
    } catch (error) {
      console.error('⚠️ Translator API error:', error);
      return '❌ Translation failed. Please ensure Chrome AI Translator API is enabled.';
    }
  };

  const handleAddTranslation = async () => {
    if (translateResults.length >= 5) {
      showToast('⚠️ Maximum 5 translations reached');
      return;
    }

    if (translateResults.some(t => t.targetLang === newTranslateTo)) {
      showToast('⚠️ This language already translated');
      return;
    }

    if (!newTranslateTo || newTranslateTo === 'auto') {
      console.error("❌ Invalid target language:", newTranslateTo);
      showToast('⚠️ Please select a valid target language (not "auto")');
      return;
    }

    setIsLoading(true);
    setShowAddLanguage(false);

    try {
      const textToTranslate = originalTextForTranslation || selectedText;
      let fromLang = translateFrom;

      console.log('🌍 Adding translation to:', newTranslateTo);
      console.log('📝 Text length:', textToTranslate.length);

      if (fromLang === 'auto') {
        const detector = await LanguageDetector.create();
        const detected = await detector.detect(textToTranslate);
        fromLang = detected[0]?.detectedLanguage || 'en';
        detector.destroy();
      }

      console.log(`🔄 Creating translator: ${fromLang} → ${newTranslateTo}`);

      const translator = await Translator.create({
        sourceLanguage: fromLang,
        targetLanguage: newTranslateTo,
      });

      const paragraphs = textToTranslate.split('\n');
      const translatedParagraphs = [];

      for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (trimmedParagraph) {
          try {
            const translated = await translator.translate(trimmedParagraph);
            translatedParagraphs.push(translated);
          } catch (error) {
            console.error('Translation error for paragraph:', error);
            translatedParagraphs.push(trimmedParagraph);
          }
        } else {
          translatedParagraphs.push('');
        }
      }

      translator.destroy();

      const finalTranslation = translatedParagraphs.join('\n\n');

      const fromLangName =
        languages.find(l => l.code === fromLang)?.name || fromLang.toUpperCase();
      const toLangName =
        languages.find(l => l.code === newTranslateTo)?.name ||
        newTranslateTo.toUpperCase();

      setTranslateResults(prev => [
        ...prev,
        {
          targetLang: newTranslateTo,
          result: `**Translation (${fromLangName} → ${toLangName}):**\n\n${finalTranslation}`,
        },
      ]);

      setCurrentTranslateIndex(translateResults.length);
      showToast('✅ Translation added!');

      const availableLanguages = languages.filter(
        l =>
          l.code !== 'auto' &&
          !translateResults.some(t => t.targetLang === l.code) &&
          l.code !== newTranslateTo
      );
      if (availableLanguages.length > 0) {
        setNewTranslateTo(availableLanguages[0].code);
      }
    } catch (error) {
      console.error('Translation error:', error);
      showToast('❌ Translation failed: ' + error.message);
    } finally {
      setIsLoading(false);
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
      `;

      const session = await LanguageModel.create({
        // monitor(m) {
        //   m.addEventListener("downloadprogress", (e) => {
        //     console.log(`Downloaded explanation language model: ${e.loaded * 100}%`);
        //   });
        // },
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

    const askingAboutCurrentPage = /\b(this|current|the)\s+(page|article|webpage|site|content|document)\b/i.test(text);
    
    const userMessage = { type: 'user', content: text, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMessage]);
    
    console.log('🔍 Current pageContext:', pageContext);
    console.log('🔍 Current URL:', currentPageUrl);
    console.log('🔍 PageContext URL:', pageContext?.url);
    console.log('🔍 User asking about current page:', askingAboutCurrentPage);
    
    try {
      const pageContextMismatch = pageContext?.url !== currentPageUrl;
      const needsCurrentPageLoad = askingAboutCurrentPage && 
        (!pageContext || pageContextMismatch);
      
      if (needsCurrentPageLoad) {
        console.log("⚡ User asking about current page - prioritizing load!");
        console.log("⚡ Mismatch detected:", {
          currentUrl: currentPageUrl,
          contextUrl: pageContext?.url
        });
        
        const readingMessage = { 
          type: 'bot', 
          content: '📖 Reading the current page... please wait', 
          source: 'system',
          timestamp: Date.now() 
        };
        setChatHistory(prev => [...prev, readingMessage]);
        
        await checkAndLoadPageContext(true);
        
        setChatHistory(prev => prev.filter(msg => msg.content !== '📖 Reading the current page... please wait'));
        
      } else if (!pageContext || !pageContext.summary) {
        console.log("⚠️ No page context yet, checking normally...");
        await checkAndLoadPageContext(false);
      }

      setIsStreaming(true);

      let prompt = text;

      const currentContext = pageContextRef.current;
      if (currentContext?.url && currentContext.url === currentPageUrl && (currentContext.summary || currentContext.fullContent)) {
        const contextToUse = currentContext.summary || currentContext.fullContent.substring(0, 3000);
        prompt = `Context: I'm reading a webpage titled "${currentContext.metadata?.title || 'Unknown'}" at ${currentContext.url}.

          Page Summary:
          ${contextToUse}

          User Question: ${text}

          Please answer based on the page context above. If the question is not related to the page, answer normally.`;
        
        console.log('Using page context for chat:', {
          hasContext: true,
          contextLength: contextToUse.length,
          title: currentContext.metadata?.title,
          url: currentContext.url
        });
      } else {
        console.log('No page context available or URL mismatch:', {
          hasContext: !!currentContext,
          contextUrl: currentContext?.url,
          currentUrl: currentPageUrl
        });
      }

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
        chatbot = await LanguageModel.create();
        sourceTag = "local";
      }

      const response = await chatbot.prompt(prompt);

      const botMessage = { type: 'bot', content: response, source: sourceTag, timestamp: Date.now() };
      setChatHistory(prev => [...prev, botMessage]);

      return response;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
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

  const readPageForChat = async (forcedUrl = null, abortSignal = null) => {
    const myLoadId = ++currentLoadIdRef.current;
    const isBackgroundLoad = forcedUrl !== null && forcedUrl !== currentPageUrl;

    try {
      if (abortSignal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (!isBackgroundLoad) {
        setIsLoading(true);
      }
      setIsPageContextLoaded(false);

      let pageUrl = forcedUrl;
      let tabId = null;
      
      if (!pageUrl) {
        if (typeof chrome === 'undefined' || !chrome.tabs) {
          setIsLoading(false);
          return null;
        }
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        pageUrl = tab?.url;
        tabId = tab?.id;
      } else {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.url === forcedUrl) {
            tabId = tab.id;
          }
        }
      }

      if (!pageUrl) {
        console.error('❌ No URL to read');
        setIsLoading(false);
        return null;
      }

      if (abortSignal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      console.log('📖 readPageForChat START for', pageUrl, 'loadId', myLoadId, 'tabId', tabId);

      setLastReadUrl(pageUrl);
      lastReadUrlRef.current = pageUrl;
      setCurrentPageUrl?.(pageUrl);

      const cachedNow = findCachedPage(pageUrl);
      if (cachedNow) {
        console.log('📦 Found cached page:', {
          url: cachedNow.url,
          contentLength: cachedNow.fullContent?.length,
          summaryLength: cachedNow.summary?.length,
          title: cachedNow.metadata?.title
        });
        
        if (myLoadId === currentLoadIdRef.current) {
          setPageContext(cachedNow);
          pageContextRef.current = cachedNow;
          setIsPageContextLoaded(true);
          setIsLoading(false);
          console.log('✅ Immediately used cache inside readPageForChat for', pageUrl);
        }
        return cachedNow;
      }

      if (abortSignal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      console.log('🔄 No cache found, extracting fresh content...');
      
      const extractedData = await extractPageContentForUrl(pageUrl, tabId);

      if (abortSignal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      console.log('📄 Extraction completed:', {
        hasData: !!extractedData,
        contentLength: extractedData?.content?.length,
        metadataTitle: extractedData?.metadata?.title,
        loadId: myLoadId,
        currentLoadId: currentLoadIdRef.current
      });
      
      if (myLoadId !== currentLoadIdRef.current) {
        console.log('⚠️ readPageForChat result discarded (stale) for', pageUrl, 'loadId', myLoadId);
        return null;
      }

      if (!extractedData || !extractedData.content || extractedData.content.trim().length < 5) { 
        console.error('❌ Cannot read this page - extraction failed or insufficient', {
          hasExtractedData: !!extractedData,
          hasContent: !!extractedData?.content,
          contentLength: extractedData?.content?.length,
          url: pageUrl
        });
        setIsLoading(false);
        setIsPageContextLoaded(false);
        throw new Error('Page content extraction failed');
      }

      const { content, metadata } = extractedData;
      
      console.log('✅ Valid content extracted:', {
        contentLength: content.length,
        contentPreview: content.substring(0, 300),
        title: metadata.title
      });
      
      const newPageContext = {
        fullContent: content,
        metadata,
        url: pageUrl,
        timestamp: Date.now(),
        summary: null,
      };

      if (abortSignal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      try {
        console.log('🔍 Starting summarization...');
          const wordCount = content.split(/\s+/).length;
          console.log('📊 Word count:', wordCount);
          
          if (apiSupport.summarizer && wordCount > 2000) {
            const chunks = chunkText(content, 4000);
            console.log('✂️ Split into', chunks.length, 'chunks');
            const summaries = [];
            for (let i = 0; i < Math.min(chunks.length, 3); i++) {
              if (abortSignal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
              }
              console.log(`🔍 Summarizing chunk ${i + 1}...`);
              try {
                const summary = await summarizeText(chunks[i]);
                summaries.push(summary.replace(/\*\*Summary.*?\*\*\n\n/g, '').trim());
              } catch (chunkErr) {
                console.warn('⚠️ Failed to summarize chunk, using excerpt:', chunkErr);
                summaries.push(chunks[i].substring(0, 500) + '...');
              }
            }
            newPageContext.summary = summaries.join('\n\n');
            console.log('✅ Summary created:', newPageContext.summary.substring(0, 200));
          } else {
            console.log('🔍 Using content excerpt as summary (API not available or short text)');
            newPageContext.summary = content.length > 3000 ? content.substring(0, 3000) + '...' : content;
          }
        } catch (sErr) {
          console.error('⚠️ Summarize failed:', sErr);
          newPageContext.summary = content.substring(0, 3000);
        }

      console.log('💾 Saving page context:', {
        url: newPageContext.url,
        fullContentLength: newPageContext.fullContent.length,
        summaryLength: newPageContext.summary.length,
        title: newPageContext.metadata.title,
        loadId: myLoadId
      });

      if (myLoadId === currentLoadIdRef.current) {
        setPageContext(newPageContext);
        pageContextRef.current = newPageContext;
        setIsPageContextLoaded(true);

        setPageHistory(prev => {
          const filtered = (prev || []).filter(p => p.url !== pageUrl);
          const updated = [newPageContext, ...filtered];
          
          if (updated.length > MAX_PAGE_HISTORY) {
            console.log(`🗑️ Removing oldest page from history (limit: ${MAX_PAGE_HISTORY})`);
            updated.splice(MAX_PAGE_HISTORY);
          }
          
          pageHistoryRef.current = updated;
          console.log('📚 Page history updated:', updated.map(p => ({ url: p.url, title: p.metadata?.title })));
          return updated;
        });

        console.log('✅ Page context loaded for chat:', { 
          title: metadata?.title, 
          url: pageUrl, 
          loadId: myLoadId,
          historySize: pageHistoryRef.current.length 
        });
        
        if (!isBackgroundLoad) {
          setIsLoading(false);
        }
        return newPageContext;
      } else {
        if (error.name === 'AbortError') {
          console.log('🛑 readPageForChat was aborted for', forcedUrl);
          throw error;
        }
        console.log('⚠️ Aborting write because loadId advanced', myLoadId);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to read page:', error);
      if (currentLoadIdRef.current === myLoadId && !isBackgroundLoad) {
        setIsLoading(false);
        setIsPageContextLoaded(false);
      }
      throw error;
    }
  };

  const extractPageContentForUrl = async (url, tabId = null) => {
    try {
      if (!isExtractableUrl(url)) {
        console.log('⚠️ Cannot extract from this URL type:', url);
        setCanExtractPage(false);
        return null;
      }

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        let targetTabId = tabId;
        let currentTab = null;
        
        if (!targetTabId) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          currentTab = tab;
          targetTabId = tab?.id;
          
          if (!url) {
            url = tab?.url;
          }
          
          if (tab?.url !== url) {
            console.warn('⚠️ Current tab URL does not match requested URL', {
              tabUrl: tab?.url,
              requestedUrl: url
            });
          }
        }
        
        if (!targetTabId || !url) {
          console.error('❌ No valid tab ID or URL found');
          return null;
        }

        const isPDF = url.toLowerCase().endsWith('.pdf') || 
                    url.includes('pdf');
        
        if (isPDF) {
          console.log('📄 Extracting PDF content for:', url);
          const pdfContent = await extractPDFContent({ id: targetTabId, url });
          return pdfContent;
        }

        console.log('📄 Extracting content from tab', targetTabId, 'for URL:', url);
        
        const cacheKey = `page_${targetTabId}_${url}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          const { content, metadata, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('✅ Using cached content for extraction', {
              contentLength: content.length,
              title: metadata.title
            });
            return { content, metadata };
          } else {
            console.log('⏰ Cache expired, re-extracting');
          }
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          function: extractWithReadability
        });

        console.log('📄 Extraction results:', results);

        if (results && results[0] && results[0].result) {
          const { content, metadata } = results[0].result;
          
          console.log('📄 Extracted raw data:', {
            contentLength: content?.length,
            contentPreview: content?.substring(0, 200),
            title: metadata?.title,
            url: url
          });

          if (!content || content.trim().length < 50) {
            console.error('❌ Extracted content is too short or empty');
            return null;
          }
          
          sessionStorage.setItem(cacheKey, JSON.stringify({
            content,
            metadata,
            timestamp: Date.now()
          }));

          console.log('✅ Successfully extracted:', {
            title: metadata.title,
            length: content.length,
            words: content.split(/\s+/).length,
            url: url
          });

          return { content, metadata };
        } else {
          console.error('❌ No results from extraction script');
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error extracting page content:', error);
      return null;
    }
  };

  const getCurrentContextForQuestion = () => {
    const ctx = pageContextRef.current;
    if (!ctx || !ctx.url) {
      return { hasContext: false };
    }

    return {
      hasContext: true,
      contextLength: ctx.summary ? ctx.summary.length : (ctx.fullContent ? Math.min(3000, ctx.fullContent.length) : 0),
      title: ctx.metadata?.title || '',
      url: ctx.url,
      summary: ctx.summary
    };
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
    `;

    const session = await LanguageModel.create({
      // monitor(m) {
      //   m.addEventListener("downloadprogress", (e) => {
      //     console.log(`Downloaded Prompts language model: ${e.loaded * 100}%`);
      //   });
      // },
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

    if (!isManualClick && !isTooltipTriggered && !isLoading) {
      console.log('❌ Auto-processing blocked - not from tooltip');
      return;
  }

    setUserCancelledProcessing(false);
    userCancelledRef.current = false;
    setIsLoading(true);
    setResult('');
    setIsTooltipTriggered(false);
    
    try {
      let processedResult = '';

      if (action !== 'chat') {
        try {
          const concepts = await generateRelatedConcepts(selectedText || text);
          setRelatedConcepts(concepts);
          setTabRelatedConcepts(prev => ({
            ...prev,
            [action]: concepts
          }));
        } catch (err) {
          const errorMsg = "❌ Failed to generate related concepts.";
          setRelatedConcepts(errorMsg);
          setTabRelatedConcepts(prev => ({
            ...prev,
            [action]: errorMsg
          }));
        }
      }
        
      switch (action) {
        case 'summarize':
          processedResult = await summarizeText(text);
          break;
        case 'translate':
          setOriginalTextForTranslation(text);
          const targetLang = translateTo === 'auto' ? 'zh' : translateTo;
          console.log('🎯 Primary translation to:', targetLang);
          
          processedResult = await translateText(text, targetLang);
            setTranslateResults([{
              targetLang: translateTo,
              result: processedResult
            }]);
            setCurrentTranslateIndex(0);
          break; 
        case 'explain':
          processedResult = await explainText(text, deepExplain);
          break;
        case 'chat':
          if (chatHistory.length === 0 && text.trim()) {
            processedResult = await chatbotWithPageContext(text);
            setSelectedText('');
          } else if (chatHistory.length > 0) {
            processedResult = await chatbotWithPageContext(text);
          }
          break;
        default:
          processedResult = 'Unknown action';
      }

      setResult(processedResult);
      
      if (action !== 'chat') {
        setTabResults(prev => ({
          ...prev,
          [action]: processedResult
        }));
      }
    } catch (error) {
      console.error('Processing error:', error);
      if (error.message === 'Processing cancelled by user' || error.message === 'User cancelled processing') {
        console.log('✅ User cancelled - state already set');
      } else {
        setResult('An error occurred while processing the text. Please try again.');
      }
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
          <div className="flex flex-col h-[700px] overflow-y-hidden space-y-4 pb-0">
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

            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-0">
              {isLoading && !chatHistory.length ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📖</div>
                  <p className="text-sm">Reading page content...</p>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">Start a conversation with the AI assistant</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                    Ask questions, request explanations, or just chat!
                  </p>
                  {isPageContextLoaded && (
                    <p className="text-xs mt-2 text-green-600 dark:text-green-400">
                      ✅ Ask questions about the current page!
                    </p>
                  )}
                  {!isPageContextLoaded && !isLoading && (
                    <p className="text-xs mt-2 text-yellow-600 dark:text-yellow-400">
                      ⚠️ Waiting for read the page but still can chat.
                    </p>
                  )}
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

                        {message.type !== "user" ? (
                          <div
                            className="text-sm whitespace-pre-line leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(marked(message.content || "")),
                            }}
                          />
                        ) : (
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                        )}

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

                {/* <button
                  onClick={togglePageContext}
                  className={`px-3 py-2 text-xs rounded-md transition-colors flex items-center space-x-1 ${
                    isPageContextLoaded
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  disabled={isLoading}
                >
                  <span>📖</span>
                  <span>{isPageContextLoaded ? 'Page Loaded' : 'Read Page'}</span>
                </button> */}

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
                    rows="3"
                    disabled={!apiSupport.chatbot || isStreaming}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!currentMessage.trim() || !apiSupport.chatbot || isStreaming}
                    className="absolute right-2 bottom-3 p-1.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    <div
      className={`w-full min-h-full overflow-hidden bg-white dark:bg-gray-900 flex flex-col relative ${
        activeTab === 'chat' ? '' : 'pb-15'
      }`}
    >
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

              {['summarize', 'translate', 'explain'].includes(activeTab) && !selectedText.trim() && canExtractPage && ( // ✅ Add canExtractPage condition
                <button
                  onClick={handleExtractPageContent}
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
            onClick={() => {
              setUserCancelledProcessing(false);
              userCancelledRef.current = false;
              processText(activeTab, selectedText, { isManualClick: true });
            }}
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
                <span>{result.includes('Processing section') ? result.replace('📄 ', '').replace('🌐 ', '').replace('💡 ', '') : 'Processing...'}</span>
              </div>
            ) : (
              `${tabs.find(t => t.id === activeTab)?.label} Text`
            )}
          </button>
        )}

        {/* Results with Animation */}
        {activeTab !== 'chat' && result && !isLoading && !result.includes('❌') && !result.includes('cancelled') && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Result</h3>
              
              {/* Translate navigation controls */}
              {activeTab === 'translate' && (
                <div className="flex items-center gap-2">
                  {translateResults.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentTranslateIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentTranslateIndex === 0}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        ←
                      </button>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {currentTranslateIndex + 1} / {translateResults.length}
                      </span>
                      <button
                        onClick={() => setCurrentTranslateIndex(prev => Math.min(translateResults.length - 1, prev + 1))}
                        disabled={currentTranslateIndex === translateResults.length - 1}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        →
                      </button>
                    </>
                  )}
                  
                  {translateResults.length < 5 && (
                    <button
                      onClick={() => setShowAddLanguage(true)}
                      className="px-4 py-2 rounded-lg cursor-pointer bg-green-500 text-white hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
                    >
                      +
                    </button>
                  )}
                </div>
              )}

              {/* Mindmap toggle for summarize/explain */}
              {(activeTab === 'summarize' || activeTab === 'explain') && (
                <div className="relative inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1 shadow-inner">
                  <div 
                    className={`absolute top-1 bottom-1 bg-white dark:bg-gray-600 rounded-full shadow-md transition-all duration-300 ease-out ${
                      showMindmap ? 'left-[40%] right-1' : 'left-1 right-[60%]'
                    }`}
                  />
                  
                  <button
                    onClick={() => {
                      setShowMindmap(false);
                      setTabShowMindmap(prev => ({
                        ...prev,
                        [activeTab]: false
                      }));
                    }}
                    disabled={isGeneratingMindmap}
                    className={`relative z-10 px-4 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                      !showMindmap 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                    }`}
                  >
                    📄 Text
                  </button>
                  <button
                    onClick={() => {
                      if (!mindmapData) {
                        generateMindmap();
                      } else {
                        setShowMindmap(true);
                        setTabShowMindmap(prev => ({
                          ...prev,
                          [activeTab]: true
                        }));
                      }
                    }}
                    disabled={isGeneratingMindmap}
                    className={`relative z-10 px-4 py-1 rounded-full text-xs font-medium transition-all duration-300 flex items-center space-x-1 ${
                      showMindmap 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                    } ${isGeneratingMindmap ? 'opacity-50' : ''}`}
                  >
                    {isGeneratingMindmap ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>🧠</span>
                        <span>Mindmap</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Add language popup for translate */}
            {activeTab === 'translate' && showAddLanguage && (
              <div className="mb-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Another Language</h4>
                <select
                  value={newTranslateTo}
                  onChange={(e) => {
                    const selectedLang = e.target.value;
                    console.log('Selected new language:', selectedLang);
                    setNewTranslateTo(selectedLang);
                  }}
                  className="w-full p-2 mb-3 border border-gray-300 rounded-lg bg-white text-sm dark:text-white dark:bg-gray-900 dark:border-gray-600"
                >
                  {languages
                    .filter(l => l.code !== 'auto' && !translateResults.some(t => t.targetLang === l.code))
                    .map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTranslation}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Translating...' : 'Translate'}
                  </button>
                  <button
                    onClick={() => setShowAddLanguage(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Results display */}
            <div className="relative overflow-hidden">
              {activeTab === 'translate' ? (
                <div 
                  key={currentTranslateIndex}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm animate-in fade-in slide-in-from-right duration-300"
                >
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked(translateResults[currentTranslateIndex]?.result || result)),
                    }}
                  />
                </div>
              ) : (!showMindmap || (activeTab !== 'summarize' && activeTab !== 'explain')) ? (
                <div 
                  key="text-view"
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 shadow-sm animate-in fade-in slide-in-from-left duration-300"
                >
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked(result)),
                    }}
                  />
                </div>
              ) : (
                <div key="mindmap-view">
                  <MindmapViewer mermaidCode={mindmapData} />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              {(activeTab === 'summarize' || activeTab === 'explain') && (
                <>
                  <button 
                    onClick={() => setActivePanel(activePanel === "analysis" ? null : "analysis")}
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      activePanel === "analysis"
                        ? 'bg-blue-500 text-white shadow-lg scale-105'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                    }`}
                  >
                    📊 Concise analysis
                  </button>
                  <button 
                    onClick={() => setActivePanel(activePanel === "related" ? null : "related")}
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      activePanel === "related"
                        ? 'bg-amber-500 text-white shadow-lg scale-105'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800'
                    }`}
                  >
                    🔗 Related topic
                  </button>
                </>
              )}
              <button 
                onClick={() => setActivePanel(activePanel === "save" ? null : "save")}
                className={`px-3 py-1 text-xs rounded-md transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  activePanel === "save"
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                }`}
              >
                💾 Save
              </button>
            </div>

            {activePanel === "analysis" && (
              <div className="mt-3 p-4 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
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

                      <p className="text-sm mt-2 text-black dark:text-white">📚 <b>Reading Suggestion</b></p>
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
              <div className={`mt-3 p-6 border rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
                showAIGlow ? 'border-transparent animate-ai-glow' : 'border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold text-lg mb-3 text-black dark:text-white">💾 Save Notes</p>
                  </div>
                  
                  <button
                    onClick={generateTitleAndTags}
                    disabled={isAIGenerating || !selectedText.trim() || !result.trim()}
                    className={`group relative px-4 mb-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      isAIGenerating 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white cursor-wait' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      {isAIGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">✨</span>
                          <span>AI Assist</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>

                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span>Title</span>
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title..."
                    className={`w-full px-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      showAIGlow ? 'border-blue-400 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>


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

                {/* Tags Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newCategory.trim()) {
                          setCategories([...categories, newCategory.trim()]);
                          setNewCategory("");
                        }
                      }}
                      placeholder="Add a tag..."
                      className={`flex-1 px-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        showAIGlow ? 'border-blue-400 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      onClick={() => {
                        if (newCategory.trim()) {
                          setCategories([...categories, newCategory.trim()]);
                          setNewCategory("");
                        }
                      }}
                      className="px-6 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 active:scale-95 font-medium"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Tags Display */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      {categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="group relative px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium flex items-center space-x-2 animate-in fade-in duration-200"
                        >
                          <span>{cat}</span>
                          <button
                            onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                            className="ml-1 hover:text-red-200 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Favorite */}
                <label className="block text-sm mt-4 mb-1 text-black dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={favorite}
                    onChange={(e) => setFavorite(e.target.checked)}
                    className="mr-2"
                  />
                  Mark as Favorite
                </label>

                <label className="block text-sm mt-2 mb-3 text-black dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={readingLater}
                    onChange={(e) => setReadingLater(e.target.checked)}
                    className="mr-2"
                  />
                  Add to Reading Later
                </label>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={confirmSave}
                    disabled={!title.trim()}
                    className={`px-3 py-1 text-xs rounded-md text-white transition-all duration-200 transform ${
                      !title.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95"
                    }`}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setActivePanel(null)}
                    className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>

                {showSavedMsg && (
                  <div className="mt-2 text-green-600 dark:text-green-400 text-sm animate-in fade-in duration-300">
                    ✅ Saved successfully!
                  </div>
                )}
              </div>
            )}

           {activePanel === "related" && (
              <div className="mt-3 p-4 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="font-semibold text-lg mb-2 text-black dark:text-white">🔗 Related Concept Network</h3>

                {loadingRelated ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">⏳ Generating related concepts...</p>
                ) : (
                  <div className="text-sm text-black dark:text-white whitespace-pre-line leading-relaxed">
                    {relatedConcepts || "No related concepts available."}
                  </div>
                )}

                {/* <div className="flex gap-2 mt-6 text-black dark:text-white">
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95">
                    Explore More
                  </button>
                  <button className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95">
                    Add to Learning Path
                  </button>
                </div> */}
              </div>
            )}

            <div className='flex gap-1 mt-3'>
              <CircleAlert className='w-4 h-4 text-gray-400 dark:text-gray-600' />
              <p className='text-gray-400 dark:text-gray-600'>AI may make mistakes. Verify before use.</p>
            </div>
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

            <div className="flex justify-center gap-2">
              <DarkModeButton />
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

        @keyframes ai-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
                        0 0 40px rgba(147, 51, 234, 0.3),
                        0 0 60px rgba(236, 72, 153, 0.2);
            border-color: rgb(59, 130, 246);
          }
          25% {
            box-shadow: 0 0 25px rgba(147, 51, 234, 0.5),
                        0 0 45px rgba(236, 72, 153, 0.3),
                        0 0 65px rgba(59, 130, 246, 0.2);
            border-color: rgb(147, 51, 234);
          }
          50% {
            box-shadow: 0 0 30px rgba(236, 72, 153, 0.5),
                        0 0 50px rgba(59, 130, 246, 0.3),
                        0 0 70px rgba(147, 51, 234, 0.2);
            border-color: rgb(236, 72, 153);
          }
          75% {
            box-shadow: 0 0 25px rgba(147, 51, 234, 0.5),
                        0 0 45px rgba(236, 72, 153, 0.3),
                        0 0 65px rgba(59, 130, 246, 0.2);
            border-color: rgb(147, 51, 234);
          }
        }

        .animate-ai-glow {
          animation: ai-glow 2s ease-in-out;
        }

        .mermaid-container {
          user-select: none;
        }

        .mermaid {
          display: inline-block;
          min-width: 300px;
        }

        .cursor-grab {
          cursor: grab;
        }

        .cursor-grabbing {
          cursor: grabbing;
        }

        @keyframes slide-in-from-left {
          from { 
            opacity: 0;
            transform: translateX(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-from-right {
          from { 
            opacity: 0;
            transform: translateX(20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }

        .slide-in-from-left {
          animation-name: slide-in-from-left;
        }

        .slide-in-from-right {
          animation-name: slide-in-from-right;
        }

        .mermaid-container {
          user-select: none;
          will-change: transform;
        }

        .mermaid-container svg {
          max-width: none !important;
          height: auto !important;
        }

        /* Mermaid mindmap styling */
        .mermaid-container .mindmap-node {
          transition: all 0.2s ease;
        }

        .mermaid-container .mindmap-node:hover {
          filter: brightness(1.1);
        }

        .mermaid-container svg {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }

        .mermaid-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes slide-in-from-right {
          from { 
            opacity: 0;
            transform: translateX(20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }

        .slide-in-from-right {
          animation-name: slide-in-from-right;
        }
      `}</style>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<SidePanel />)