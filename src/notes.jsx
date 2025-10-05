import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Bookmark, Search, BookOpen, Clock, Star, Settings, Menu, X, Trash2, Tag, Calendar, ChevronDown, ChevronUp} from 'lucide-react';

const ReadBuddyNotesPage = () => {
  const [activeTab, setActiveTab] = useState('saved');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    chrome.storage.local.get(['savedItems'], (result) => {
      const items = result.savedItems || []; 
      console.log("📦 Loaded items:", items);
      setSavedItems(items);
    });
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode') || 'false';
    setIsDarkMode(savedTheme === 'true');
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['saved', 'reading', 'favorites'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleDeleteItem = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const updatedItems = savedItems.filter(item => item.id !== id);
      setSavedItems(updatedItems);

      chrome.storage.local.set({ savedItems: updatedItems }, () => {
        console.log("✅ Item deleted from chrome.storage.local");
      });
    }
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

    if (activeTab === 'saved') {
      filtered = savedItems.filter(item =>
        ['summarize', 'translate', 'explain'].includes(
          (item.category || '').toLowerCase()
        )
      );
      console.log("🔎 Filtered Saved Items:", filtered);
    } else if (activeTab === 'reading') {
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
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
          count={savedItems.filter(item => item.category === 'saved').length}
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
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-80 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              {activeTab === 'saved' && (
                <div className="mb-3 flex gap-3 overflow-x-auto pb-2">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setCategoryFilter('summarize')}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'summarize'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => setCategoryFilter('translator')}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'translator'
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md'
                    }`}
                  >
                    Translator
                  </button>
                  <button
                    onClick={() => setCategoryFilter('explain')}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === 'explain'
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md'
                    }`}
                  >
                    Explain
                  </button>
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
                </div>
              )}
              
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
                      {/* Date Header */}
                      <div className="sticky top-0 z-10 flex items-center mb-6 py-2">
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg">
                          <Calendar className="inline w-4 h-4 mr-2 mb-0.5" />
                          {formatDate(group.date)}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur opacity-30 rounded-xl"></div>
                        </div>
                      </div>
                      
                      {/* Items for this date */}
                      <div className="space-y-5 relative before:absolute before:left-6 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-blue-400 before:via-purple-400 before:to-pink-400 dark:before:from-blue-600 dark:before:via-purple-600 dark:before:to-pink-600">
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
                            translator: { 
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
                              className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 ml-14 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 relative group"
                            >
                              {/* Timeline dot */}
                              <div className={`absolute -left-[43px] top-8 w-5 h-5 bg-gradient-to-br ${config.gradient} rounded-full border-4 border-gray-50 dark:border-gray-900 shadow-lg group-hover:scale-125 transition-transform`}></div>
                              
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
                                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                          <Star className="w-4 h-4" />
                                          Result
                                        </p>
                                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm">
                                          {item.result}
                                        </p>
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800"
                                      >
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t-2 border-gray-100 dark:border-gray-700 flex-wrap">
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
                                    onClick={() => handleToggleFavorite(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border-2 ${
                                      item.favorite
                                        ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                                        : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <Star className={`w-4 h-4 ${item.favorite ? 'fill-yellow-500 dark:fill-yellow-400' : ''}`} />
                                    {item.favorite ? 'Favorited' : 'Favorite'}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border-2 border-red-200 dark:border-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Remove
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ReadBuddyNotesPage  />);