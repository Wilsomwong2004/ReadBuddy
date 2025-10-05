import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Bookmark, Search, BookOpen, Clock, Star, Settings, Menu, X, Trash2, Tag, Calendar } from 'lucide-react';

const ReadBuddyNotesPage = () => {
  const [activeTab, setActiveTab] = useState('saved');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('savedItems') || '[]');
    setSavedItems(items);
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
    const updatedItems = savedItems.filter(item => item.id !== id);
    setSavedItems(updatedItems);
    localStorage.setItem('savedItems', JSON.stringify(updatedItems));
  };

  const handleToggleFavorite = (id) => {
    const updatedItems = savedItems.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    setSavedItems(updatedItems);
    localStorage.setItem('savedItems', JSON.stringify(updatedItems));
  };

  const getFilteredItems = () => {
    let filtered = savedItems;

    if (activeTab === 'saved') {
      filtered = savedItems.filter(item => item.category === 'saved');
    } else if (activeTab === 'reading') {
      filtered = savedItems.filter(item => item.category === 'reading');
    } else if (activeTab === 'favorites') {
      filtered = savedItems.filter(item => item.favorite === true);
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

  const filteredItems = getFilteredItems();

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
          count={savedItems.filter(item => item.category === 'reading').length}
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
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

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16">
                  <Bookmark className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {searchQuery ? 'No items found' : `No ${getTabTitle().toLowerCase()} yet`}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Start saving notes from your extension'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <article
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.noteSpace && (
                              <>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{item.noteSpace}</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                              </>
                            )}
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>{item.date}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {item.title || 'Untitled Note'}
                          </h3>
                          
                          {item.text && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Original Text:</p>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                {item.text}
                              </p>
                            </div>
                          )}
                          
                          {item.result && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {item.result}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap mt-3">
                            {item.tags && item.tags.length > 0 && item.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-full"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                            Visit Page
                          </a>
                        )}
                        
                        <button
                          onClick={() => handleToggleFavorite(item.id)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            item.favorite
                              ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                              : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${item.favorite ? 'fill-yellow-500 dark:fill-yellow-400' : ''}`} />
                          {item.favorite ? 'Favorited' : 'Favorite'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </article>
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