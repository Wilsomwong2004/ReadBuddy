import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BookmarkIcon, SearchIcon, BookOpen, Home, Clock, Star, Settings, Menu, X, Trash2, ExternalLink } from 'lucide-react';

const ReadBuddyNotesPage = () => {
  const [activeTab, setActiveTab] = useState('saved');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [savedArticles, setSavedArticles] = useState([
    {
      id: 1,
      title: "The Future of Web Development",
      source: "TechCrunch",
      excerpt: "Exploring the latest trends in web development including AI integration, serverless architecture, and the evolution of JavaScript frameworks...",
      url: "https://techcrunch.com/example",
      savedDate: "2024-09-28",
      readTime: "8 min read",
      category: "Technology"
    },
    {
      id: 2,
      title: "Understanding React Server Components",
      source: "React Blog",
      excerpt: "A comprehensive guide to React Server Components and how they change the way we think about rendering in React applications...",
      url: "https://react.dev/example",
      savedDate: "2024-09-27",
      readTime: "12 min read",
      category: "Programming"
    },
    {
      id: 3,
      title: "The Art of Minimalist Design",
      source: "Design Weekly",
      excerpt: "Less is more: How minimalist design principles can create powerful user experiences and improve usability across digital products...",
      url: "https://designweekly.com/example",
      savedDate: "2024-09-25",
      readTime: "6 min read",
      category: "Design"
    }
  ]);

  const handleDeleteArticle = (id) => {
    setSavedArticles(savedArticles.filter(article => article.id !== id));
  };

  const filteredArticles = savedArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <NavItem icon={BookmarkIcon} label="Saved" active />
        <NavItem icon={Clock} label="Reading List" />
        <NavItem icon={Star} label="Favorites" />
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <NavItem icon={Settings} label="Settings" />
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, active = false }) => (
    <button
      onClick={() => active && setActiveTab('saved')}
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
              <h2 className="text-xl font-semibold text-gray-800">Saved Articles</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search saved articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <BookmarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'No articles found' : 'No saved articles yet'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Start saving articles to read them later'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <article
                    key={article.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-600">{article.source}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{article.readTime}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{article.savedDate}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-3">
                          {article.excerpt}
                        </p>
                        <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        <BookOpen className="w-4 h-4" />
                        Read Now
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        Open Link
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ReadBuddyNotesPage  />);