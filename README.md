## ReadBuddy - AI Reading Assistant

<div align="center">

<img src="https://github.com/Wilsomwong2004/ReadBuddy/blob/main/src/assets/Readbuddy_pic/HeroNew.png" alt="ReadBuddy Logo" width="700">

**ReadBuddy - AI Powered Reading Assistant**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow?logo=googlechrome)](https://chromewebstore.google.com/detail/readbuddy-ai-reading-assi/pkgomicahmbagpmhkablpcanklejnnlk)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Wilsomwong2004/readbuddy/pulls)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*Read Smarter, Not Harder*

</div>

---

## 🎯 Project Introduction

ReadBuddy is an intelligent reading assistant extension based on **Chrome's built-in Gemini Nano AI**, providing instant, privacy-secure reading assistance on your local device.

### ✨ Core Features

- 🔒 **Complete Privacy Protection** - All AI processing happens locally, data never leaves your device
- ⚡ **Instant Response** - Based on Chrome's built-in AI, no internet connection required
- 🎯 **Smart Reading** - Four core functions: Summarize, Translate, Explain, Chat
- 📚 **Knowledge Management** - Personal knowledge base to save important reading content
- 🆓 **Completely Free** - No subscription fees, no usage limits

## 🚀 Quick Start

### For Users

#### Developer Mode Installation
1. Download ReadBuddy extension files
2. Open Chrome, go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension folder
6. ReadBuddy icon will appear in toolbar

### For Judges/Developers

#### Environment Requirements
- **Chrome Version**: 118+ (supports built-in AI features)
- **Operating System**: Windows 10/11, macOS 10.15+, Linux
- **Memory**: Recommended 8GB+ RAM
- **Storage**: 100MB available space

-------------
#### ⚠️ Important: Enable Gemini Nano in Chrome Flags
**ReadBuddy requires Chrome's built-in AI to be enabled. Please follow these steps:**

1. Open Chrome and go to `chrome://flags/`
2. Search for "**Optimization Guide on Device**"
3. Set it to "**Enabled**" (not "Enabled BypassPerfRequirement")
4. Search for "**Prompt API for Gemini Nano**"
5. Set it to "**Enabled**"
6. **RESTART CHROME** for changes to take effect

-------------

### Installation Steps

#### Method 1: Manual Install
#### 1\. Clone repository
```bash
git clone https://github.com/yourusername/readbuddy.git
cd readbuddy
```

#### 2\. Install dependencies
```bash
npm install
```

##### 3\. Build extension
```bash
npm run build
```

##### 4\. Load extension in Chrome


#### Method 2: Chrome Web Store
1. Go to Chrome Web Store or open link below
```bash
https://chromewebstore.google.com/detail/readbuddy-ai-reading-assi/pkgomicahmbagpmhkablpcanklejnnlk
```
2. Search ReadBuddy (If use link can pass this)
3. Click Add to Chrome
4. DONE! Enjoy!

##### Chrome Loading Steps

1.  Open Chrome, visit `chrome://extensions/`
2.  Enable "Developer mode" (top-right switch)
3.  Click "Load unpacked"
4.  Select project root directory
5.  Ensure extension is enabled

##### Verification

1.  Select text on any webpage
2.  Right-click, should see ReadBuddy options
3.  Or click ReadBuddy icon in toolbar to open sidebar

📖 User Guide
-------------

### Basic Functions

##### 1\. Smart Summarize

-   Select text → Click extension icon → Choose "Summarize"
-   Or right-click menu → "ReadBuddy: Summarize"
-   Get key points, paragraph, or Q&A format summaries

##### 2\. Instant Translate

-   Support 9 language translations
-   Context-aware translation
-   Maintains professional term accuracy

##### 3\. Deep Explain

-   Simplifies complex concepts
-   Structured output: overview, detailed analysis, key insights
-   Suitable for academic and technical documents

##### 4\. Smart Chat

-   Q&A based on page content
-   Multi-turn conversation
-   Automatically judges if page context is needed

### Advanced Features

##### 📊 Quick Analysis

-   Text feature analysis
-   Reading difficulty assessment
-   Reading time estimation

##### 💾 Save Function

-   Build personal knowledge base
-   Add tags and notes
-   Quick retrieval of saved content

##### 🔗 Related Concepts

-   Smart concept expansion
-   Knowledge network building
-   Recommended extended reading

##### 🧠 Generate Mindmap

-   Idea expansion
-   Knowledge connection
-   Suggested reading

### Usage Tips

1.  Best Practices:

    -   For long articles, use summary function first to get overview
    -   Use explain function when encountering professional terms
    -   Save important content for later review

2.  Performance Optimization:

    -   Use Chat function for simple questions (faster response)
    -   Trigger complex analysis when needed
    -   Use save function to avoid repeated processing

🏗️ Technical Architecture
--------------------------

### Core Components

```bash
ReadBuddy/
├── manifest.json          # Chrome extension configuration
├── dist/                  # Build output files (can be ignored during development)
│   ├── background.js      # Core background script
│   ├── content.js         # Core content script
│   ├── popup.html         # Popup interface
│   ├── popup.js           # Popup logic
│   ├── sidepanel.html     # Sidebar interface
│   ├── sidepanel.js       # Sidebar logic
│   └── assets/            # Bundled resources (icons, library files, etc.)
├── src/                   # Source code directory
│   ├── background.js      # Background script (for development)
│   ├── content.js         # Content script (for development)
│   ├── popup.jsx          # Popup React component
│   ├── sidepanel.jsx      # Sidebar React component
│   ├── settings.jsx       # Settings page React component
│   ├── notes.jsx          # Notes page React component
│   └── assets/            # Static resources
│       ├── icon/          # Icons
│       └── Readbuddy_pic/ # UI image resources
└── utils/                  # Utility scripts
    ├── darkMode.js         # Dark mode functionality
    └── preload.js          # Page preload script
```

### API Usage

-   Chrome Built-in AI: Gemini Nano
-   Summarizer API: Text summarization
-   Translator API: Language translation
-   Prompt API: Custom AI interaction
-   Chrome Storage API: Data persistence

### Technical Features

-   🔧 Hybrid Architecture: Local AI processing + Cloud enhancement (on-demand)
-   🎨 Modern UI: Responsive design, dark mode support
-   📱 Performance Optimization: Smart caching, lazy loading
-   🛡️ Error Handling: Graceful degradation, friendly prompts

🎯 Competition Highlights
-------------------------

### Technical Innovation

1.  Deep Chrome Built-in AI Integration

    -   Fully utilizes Gemini Nano capabilities
    -   Local processing ensures privacy security
    -   Zero-latency AI response

2.  Smart Content Understanding

    -   Multi-dimensional text analysis
    -   Context-aware processing
    -   Personalized learning recommendations

3.  Excellent User Experience

    -   Intuitive interaction design
    -   Progressive feature display
    -   Complete error handling

### Product Value

-   ✅ Solves Real Pain Points: Information overload, low reading efficiency
-   ✅ Differentiation Advantages: Privacy protection, offline use, completely free
-   ✅ Strong Extensibility: Modular architecture, easy feature expansion

🔧 Development Guide
--------------------

### Environment Setup

```bash
# Install development dependencies
npm install

# Development mode
npm run dev

# Build production version
npm run build

```

### File Structure Explanation

``` bash
src/
├── assets/         # Static resources (icons, images, etc.)
├── lib/            # Third-party libraries (mermaid.js, pdf.mjs, readability.js)
├── utils/          # Utility scripts (darkMode.js, darkModeBtn.jsx, preload.js)
├── background.js   # Background script for global events
├── content.js      # Content script injected into web pages
├── popup.jsx       # Popup interface React component
├── sidepanel.jsx   # Sidebar interface React component
├── settings.jsx    # Settings page React component
└── notes.jsx       # Notes page React component

```

🐛 Troubleshooting
------------------

### Common Issues

Q: Extension icon is not showing?\
A: Reload the extension in chrome://extensions or restart Chrome.

Q: AI functions are not responding?\
A: Ensure your Chrome version supports built-in AI, or refresh the page.

Q: Save function is not working?\
A: Verify storage permissions, clear extension data, and try again.

Q: Performance is slow?\
A: ReadBuddy processes text locally, so performance depends on text length. For very long texts, it splits the content into chunks, summarizes each, and combines them. Before processing, the extension informs you of the estimated time. Using the summary function first can help speed up the process.

Q: "AI features not available" error?\
A: Make sure Gemini Nano is enabled in chrome://flags and restart Chrome.


📄 License
----------

This project is licensed under the MIT License - see the [LICENSE](https://license/) file for details

🙏 Acknowledgments
------------------

-   Chrome team for built-in AI capabilities
-   Mozilla's Readability.js and PDF.js project
-   Mermaid.js for generating Mindmaps
-   All contributors and test users

📞 Contact Us
-------------

-   🐛 Issues: [GitHub Issues](https://github.com/Wilsomwong2004/readbuddy/issues)
-   💬 Discussions: [GitHub Discussions](https://github.com/Wilsomwong2004/readbuddy/discussions)


🎯 Special Guide for Judges
---------------------------

### Demo Highlights

1.  Core Technology: Showcase deep integration with Chrome's built-in AI
2.  User Experience: Smooth interactions and instant responses
3.  Product Value: Complete solution solving real user pain points

### Testing Suggestions

-   Test on different types of webpages (news, academic, technical documents)
-   Experience switching between four core functions
-   Verify offline usage capability
-   Test save and knowledge base functions

### Technical Evaluation Points

-   ✅ Correct usage of Chrome AI API
-   ✅ Performance optimization measures
-   ✅ Error handling and edge cases
-   ✅ Code quality and architecture design

Enjoy your experience! 🚀

* * * * *

<div align="center">

"Make reading a pleasure, not a burden"

[Report Issues](https://github.com/Wilsomwong2004/readbuddy/issues)

</div>
