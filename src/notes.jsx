import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { loadDarkMode, saveDarkMode, applyDarkMode } from './utils/darkMode';
import { Bookmark, Search, BookOpen, Clock, Star, Settings, Menu, X, Trash2, Tag, Calendar, ChevronDown, ChevronUp, Grid, List, Copy, Download, ZoomIn, ZoomOut, RotateCcw, Info} from 'lucide-react';

const ReadBuddyNotesPage = () => {
  const [activeTab, setActiveTab] = useState('saved');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState("false");
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showMindmap, setShowMindmap] = useState({});
  const [currentTranslationIndex, setCurrentTranslationIndex] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const MindmapViewer = ({ mermaidCode, isDarkMode }) => {
    const [svgContent, setSvgContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [mindmapTheme, setMindmapTheme] = useState('default');
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showInstructions, setShowInstructions] = useState(false);
    const containerRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
      chrome.storage.local.get(['mindmapTheme'], (result) => {
        if (result.mindmapTheme) {
          setMindmapTheme(result.mindmapTheme);
        }
      });
    }, []);

    useEffect(() => {
      const renderMermaid = async () => {
        if (!mermaidCode || !mermaidCode.trim()) {
          setIsLoading(false);
          return;
        }

        let attempts = 0;
        while (!window.mermaid && attempts < 100) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.mermaid) {
          console.error('Mermaid failed to load');
          setIsLoading(false);
          return;
        }

        try {
          await window.mermaid.initialize({ 
            startOnLoad: false,
            theme: mindmapTheme,
            mindmap: {
              padding: 20,
              useMaxWidth: true
            },
            securityLevel: 'loose'
          });

          const id = `mindmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const renderResult = await window.mermaid.render(id, mermaidCode);
          const svg = renderResult.svg || renderResult;
          
          setSvgContent(svg);
          setIsLoading(false);
        } catch (error) {
          console.error('Render error:', error);
          setIsLoading(false);
        }
      };

      renderMermaid();
    }, [mermaidCode, mindmapTheme]);

    const handleThemeChange = (theme) => {
      setMindmapTheme(theme);
      chrome.storage.local.set({ mindmapTheme: theme });
    };

    const handleCopy = async () => {
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

    const handleDownload = (format) => {
      const svgElement = svgRef.current?.querySelector('svg');
      if (!svgElement) return;

      if (format === 'svg') {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mindmap-${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mindmap-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    };

    const handleZoomIn = () => {
      setZoom(prev => Math.min(prev + 0.2, 3));
    };

    const handleZoomOut = () => {
      setZoom(prev => Math.max(prev - 0.2, 0.5));
    };

    const handleZoomReset = () => {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
      if (e.target.closest('button') || e.target.closest('.settings-panel')) return;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, dragStart]);

    const themes = [
      { value: 'default', label: 'Default', emoji: '🎨' },
      { value: 'dark', label: 'Dark', emoji: '🌙' },
      { value: 'forest', label: 'Forest', emoji: '🌲' },
      { value: 'neutral', label: 'Neutral', emoji: '⚪' },
      { value: 'base', label: 'Base', emoji: '▦' }
    ];

    if (isLoading) {
      return (
        <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading mindmap...</p>
        </div>
      );
    }

    return (
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Top Controls */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          
          <button
            onClick={handleCopy}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600"
            title="Copy Code"
          >
            <Copy className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          
          <button
            onClick={handleZoomReset}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600"
            title="Reset Zoom"
          >
            <RotateCcw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Instructions Button */}
        <div 
          className="absolute bottom-3 left-3 z-10"
          onMouseEnter={() => setShowInstructions(true)}
          onMouseLeave={() => setShowInstructions(false)}
        >
          <div className="relative">
            <div className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md">
              <Info className="w-4 h-4" />
            </div>
              
            {/* Instructions Tooltip */}
            {showInstructions && (
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
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel absolute top-16 left-3 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mindmap Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Theme Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme</h4>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      mindmapTheme === theme.value
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    <span className="mr-2">{theme.emoji}</span>
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 my-4" />

            {/* Export Options */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Export</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('png')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  PNG
                </button>
                <button
                  onClick={() => handleDownload('svg')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  SVG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mindmap Content */}
        <div 
          ref={svgRef}
          className={`w-full p-4 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ minHeight: '400px' }}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              pointerEvents: 'none'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    chrome.storage.local.get(['savedItems'], (result) => {
      const items = result.savedItems || []; 
      console.log("Loaded items:", items);
      setSavedItems(items);
    });
  }, []);

  useEffect(() => {
    loadDarkMode((isDark) => {
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    });

    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes.darkMode) {
        const newDarkMode = changes.darkMode.newValue;
        setIsDarkMode(newDarkMode);
        applyDarkMode(newDarkMode);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['saved', 'reading', 'favorites'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    const loadMermaid = async () => {
    if (window.mermaid) return;
      try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('lib/mermaid.min.js');
        script.async = false;
        
        script.onload = () => {
          if (window.mermaid) {
            window.mermaid.initialize({ 
              startOnLoad: false,
              theme: isDarkMode ? 'dark' : 'default'
            });
            console.log('✅ Mermaid loaded for notes page');
          }
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Mermaid:', error);
      }
    };
    loadMermaid();
  }, [isDarkMode]);

  const handleToggleMindmap = (id) => {
    setShowMindmap(prev => ({
    ...prev,
    [id]: !prev[id]
    }));
  };

  const handleNextTranslation = (id, translations) => {
    setCurrentTranslationIndex(prev => {
    const currentIndex = prev[id] || 0;
    const nextIndex = (currentIndex + 1) % translations.length;
    return { ...prev, [id]: nextIndex };
    });
  };

  const handlePrevTranslation = (id, translations) => {
    setCurrentTranslationIndex(prev => {
    const currentIndex = prev[id] || 0;
    const prevIndex = currentIndex === 0 ? translations.length - 1 : currentIndex - 1;
    return { ...prev, [id]: prevIndex };
    });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const updatedItems = savedItems.filter(item => item.id !== id);
      setSavedItems(updatedItems);

      chrome.storage.local.set({ savedItems: updatedItems }, () => {
        console.log("Item deleted from chrome.storage.local");
      });
    }
  };

  const handleToggleReadingLater = (id) => {
    const updatedItems = savedItems.map(item =>
      item.id === id ? { ...item, readingLater: !item.readingLater } : item
    );

    setSavedItems(updatedItems);

    chrome.storage.local.set({ savedItems: updatedItems }, () => {
      console.log(`Item ${id} reading later status updated`);
    });
  };

  const handleToggleFavorite = (id) => {
    const updatedItems = savedItems.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );

    setSavedItems(updatedItems);

    chrome.storage.local.set({ savedItems: updatedItems }, () => {
      console.log(`Item ${id} favorite status updated in chrome.storage.local`);
    });
  };

  const toggleExpandItem = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getFilteredItems = () => {
    let filtered = savedItems;

    if (activeTab === 'reading') {
      filtered = savedItems.filter(item => item.readingLater === true);
    } else if (activeTab === 'favorites') {
      filtered = savedItems.filter(item => item.favorite === true);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => {
        const itemType = getItemType(item);
        return itemType === categoryFilter;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.result?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const formatResult = (result) => {
    if (!result) return '';
    
    // Split by numbered patterns (1., 2., etc.) or bullet points
    const lines = result.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      // Check if line starts with a number followed by a period (e.g., "1.", "2.")
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)/);
      if (numberedMatch) {
        const [, number, content] = numberedMatch;
        return (
          <div key={index} className="mb-4">
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {number}. {content}
            </div>
          </div>
        );
      }
      
      // Check if it's a header (contains colons)
      if (trimmedLine.includes(':') && !trimmedLine.startsWith('•')) {
        const [header, ...rest] = trimmedLine.split(':');
        return (
          <div key={index} className="mb-3">
            <strong className="text-gray-900 dark:text-gray-100">{header}:</strong>
            {rest.join(':').trim() && <span className="ml-1">{rest.join(':').trim()}</span>}
          </div>
        );
      }
      
      // Handle bullet points (lines starting with • or *)
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
        const content = trimmedLine.substring(1).trim();
        return (
          <div key={index} className="flex gap-2 mb-2 ml-4">
            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span className="flex-1">{content}</span>
          </div>
        );
      }
      
      // Regular text
      return (
        <div key={index} className="mb-2">
          {trimmedLine}
        </div>
      );
    }).filter(Boolean);
  };

  const getItemType = (item) => {
    return (item.category || "other").toLowerCase().trim();
  };

  const groupItemsByDate = (items) => {
    const grouped = {};
    items.forEach(item => {
      const date = item.date || 'No Date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return Object.keys(grouped)
      .sort((a, b) => new Date(b || 0) - new Date(a || 0))
      .map(date => ({
        date,
        items: grouped[date]
      }));
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'No Date') return 'No Date';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const filteredItems = getFilteredItems();
  const groupedItems = groupItemsByDate(filteredItems);

  const handleNavigateToSettings = () => {
    window.location.href = 'settings.html';
  };

  const SidebarNav = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          ReadBuddy
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <NavItem 
          icon={Bookmark} 
          label="Saved Notes" 
          active={activeTab === 'saved'}
          onClick={() => setActiveTab('saved')}
          count={savedItems.length}
        />
        <NavItem 
          icon={Clock} 
          label="Reading List" 
          active={activeTab === 'reading'}
          onClick={() => setActiveTab('reading')}
          count={savedItems.filter(item => item.readingLater === true).length}
        />
        <NavItem 
          icon={Star} 
          label="Favorites" 
          active={activeTab === 'favorites'}
          onClick={() => setActiveTab('favorites')}
          count={savedItems.filter(item => item.favorite === true).length}
        />
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <NavItem 
          icon={Settings} 
          label="Settings"
          onClick={handleNavigateToSettings}
        />
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, active = false, onClick, count }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          active 
            ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const getTabTitle = () => {
    switch(activeTab) {
      case 'saved': return 'Saved Notes';
      case 'reading': return 'Reading List';
      case 'favorites': return 'Favorites';
      default: return 'Notes';
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}>
          <SidebarNav />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {sidebarOpen ? (
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{getTabTitle()}</h2>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCategoryFilter('summarize')}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'summarize'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => setCategoryFilter('translate')}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'translate'
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md'
                    }`}
                  >
                    Translate
                  </button>
                  <button
                    onClick={() => setCategoryFilter('explain')}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'explain'
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md'
                    }`}
                  >
                    Explain
                  </button>
                </div>
                {/* <button
                  onClick={() => setCategoryFilter('other')}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === 'other'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg shadow-gray-500/30'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
                  }`}
                >
                  Other
                </button> */}

                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    title="Grid view"
                  >
                    <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              
              {filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <div className="p-12 max-w-md mx-auto">
                    <Bookmark className="w-20 h-20 text-blue-400 dark:text-blue-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                      {searchQuery ? 'No items found' : `No ${getTabTitle().toLowerCase()} yet`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery 
                        ? 'Try adjusting your search terms' 
                        : 'Start saving notes to see them appear here'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {groupedItems.map((group) => (
                    <div key={group.date} className="relative">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {formatDate(group.date)}
                        </h3>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                      
                      {/* Items for this date */}
                      <div className={viewMode === 'grid' 
                          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                          : 'space-y-4'
                        }>
                        {group.items.map((item) => {
                          const itemType = getItemType(item);
                          const isExpanded = expandedItems.has(item.id);
                          
                          const typeConfig = {
                            summarize: { 
                              color: 'blue', 
                              gradient: 'from-blue-600 to-blue-500',
                              bgLight: 'bg-blue-50 dark:bg-blue-900/20',
                              textLight: 'text-blue-700 dark:text-blue-300',
                              border: 'border-blue-200 dark:border-blue-800'
                            },
                            translate: { 
                              color: 'green', 
                              gradient: 'from-green-600 to-green-500',
                              bgLight: 'bg-green-50 dark:bg-green-900/20',
                              textLight: 'text-green-700 dark:text-green-300',
                              border: 'border-green-200 dark:border-green-800'
                            },
                            explain: { 
                              color: 'orange', 
                              gradient: 'from-orange-600 to-orange-500',
                              bgLight: 'bg-orange-50 dark:bg-orange-900/20',
                              textLight: 'text-orange-700 dark:text-orange-300',
                              border: 'border-orange-200 dark:border-orange-800'
                            },
                            other: { 
                              color: 'gray', 
                              gradient: 'from-gray-600 to-gray-500',
                              bgLight: 'bg-gray-50 dark:bg-gray-900/20',
                              textLight: 'text-gray-700 dark:text-gray-300',
                              border: 'border-gray-200 dark:border-gray-800'
                            }
                          };

                          const config = typeConfig[itemType] || typeConfig.other;
                          
                          return (
                            <article
                                key={item.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 ${
                                  viewMode === 'grid' ? 'flex flex-col h-full' : ''
                                }`}
                              >
                                                
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                      {itemType !== 'other' && (
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${config.bgLight} ${config.textLight} shadow-sm`}>
                                          {itemType}
                                        </span>
                                      )}
                                      
                                      {item.noteSpace && (
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                                          {item.noteSpace}
                                        </span>
                                      )}
                                      
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{item.time}</span>
                                      </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                                      {item.title || 'Untitled Note'}
                                    </h3>
                                    
                                    {!isExpanded && item.result && (
                                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                        {item.result}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Expandable Content */}
                                {isExpanded && (
                                  <div className="space-y-4 animate-in slide-in-from-top-2">
                                    {item.text && (
                                      <div className={`${config.bgLight} ${config.border} border-2 rounded-xl p-4`}>
                                        <p className={`text-xs font-bold uppercase tracking-wide ${config.textLight} mb-2 flex items-center gap-2`}>
                                          <BookOpen className="w-4 h-4" />
                                          Input Text
                                        </p>
                                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                          {item.text}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {item.result && (
                                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                            <Star className="w-4 h-4" />
                                            Result
                                          </p>
                                          
                                          {/* Mindmap Toggle for summarize/explain */}
                                          {(itemType === 'summarize' || itemType === 'explain') && item.mindmapData && (
                                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                              <button
                                                onClick={() => handleToggleMindmap(item.id)}
                                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                  !showMindmap[item.id]
                                                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                              >
                                                📄 Text
                                              </button>
                                              <button
                                                onClick={() => handleToggleMindmap(item.id)}
                                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                  showMindmap[item.id]
                                                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                              >
                                                🧠 Mindmap
                                              </button>
                                            </div>
                                          )}
                                          
                                          {/* Translation Navigation */}
                                          {itemType === 'translate' && item.translations && item.translations.length > 1 && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handlePrevTranslation(item.id, item.translations)}
                                                className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                              >
                                                ←
                                              </button>
                                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {((currentTranslationIndex[item.id] || 0) + 1)} / {item.translations.length}
                                              </span>
                                              <button
                                                onClick={() => handleNextTranslation(item.id, item.translations)}
                                                className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                              >
                                                →
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Conditional Rendering: Mindmap or Text */}
                                        {showMindmap[item.id] && item.mindmapData ? (
                                          <MindmapViewer mermaidCode={item.mindmapData} isDarkMode={isDarkMode} />
                                        ) : (
                                          <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm space-y-1">
                                            {itemType === 'translate' && item.translations && item.translations.length > 0 ? (
                                              formatResult(item.translations[currentTranslationIndex[item.id] || 0].result)
                                            ) : (
                                              formatResult(item.result)
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Tags */}
                                {item.tags && item.tags.length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.tags.map((tag, index) => (
                                      <span 
                                        key={index}
                                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800"
                                      >
                                        <Tag className="w-3 h-3" />
                                        <span className="hidden sm:inline">{tag}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Actions */}
                                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                  <button
                                    onClick={() => toggleExpandItem(item.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                                  >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {isExpanded ? 'Collapse' : 'Expand'}
                                  </button>
                                  
                                  {item.url && (
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r ${config.gradient} rounded-lg hover:shadow-lg transition-all`}
                                    >
                                      <BookOpen className="w-4 h-4" />
                                      Visit
                                    </a>
                                  )}

                                  <button
                                    onClick={() => handleToggleReadingLater(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${
                                      item.readingLater
                                        ? 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                                        : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <Clock className={`w-4 h-4 ${item.readingLater ? '' : ''}`} />
                                    <span className="hidden sm:inline">{item.readingLater ? 'Reading Later' : 'Read Later'}</span>
                                    <span className="sm:hidden">Later</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleToggleFavorite(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border ${
                                      item.favorite
                                        ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                                        : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <Star className={`w-4 h-4 ${item.favorite ? 'fill-yellow-500 dark:fill-yellow-400' : ''}`} />
                                    <span className="hidden sm:inline">{item.favorite ? 'Favorited' : 'Favorite'}</span>
                                    <span className="sm:hidden">Fav</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800 ml-auto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Remove</span>
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {toastMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg animate-slide-down-up z-50">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ReadBuddyNotesPage  />);