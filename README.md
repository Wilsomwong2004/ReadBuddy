## ReadBuddy - AI Reading Assistant

<div align="center">

![ReadBuddy Logo](https://via.placeholder.com/128x128.png?text=📚)

**ReadBuddy - AI Powered Reading Assistant**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow?logo=googlechrome)](https://chrome.google.com/webstore)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Wilsomwong2004/readbuddy/pulls)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*Read Smarter, Not Harder*

</div>

## 🌐 Language

**English** | **[Simplified Chinese 简体中文](README_zh.md)**

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

#### Method 1: Chrome Web Store (Recommended)
1. Visit [Chrome Web Store - ReadBuddy](https://chrome.google.com/webstore)
2. Click "Add to Chrome"
3. Confirm installation permissions
4. Start using!

#### Method 2: Developer Mode Installation
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

![Chrome Flags Settings](https://via.placeholder.com/600x400.png?text=Chrome+Flags+Setup)

-------------

### Installation Steps


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

-   Support 50+ language translations

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
readbuddy/
├── manifest.json          # Extension configuration
├── popup/                 # Popup interface
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── sidepanel/             # Sidebar interface
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── content/               # Content scripts
│   └── content.js
├── background/            # Background scripts
│   └── background.js
└── assets/                # Static resources
    ├── icons/
    └── images/
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

# Code linting
npm run lint
```

### File Structure Explanation

``` bash
src/
├── components/     # React components
├── utils/         # Utility functions
├── services/      # API services
├── styles/        # Style files
└── locales/       # Internationalization files
```

### Core Function Implementation

javascript

``` bash
// AI processing core
class AICore {
  async summarize(text, mode = 'keypoints') {
    // Use Summarizer API
  }

  async translate(text, targetLang) {
    // Use Translator API
  }

  async explain(text, depth = 'standard') {
    // Use Prompt API
  }
}
```

🐛 Troubleshooting
------------------

### Common Issues

Q: Extension icon not showing?\
A: Reload extension or restart Chrome

Q: AI functions not responding?\
A: Check if Chrome version supports built-in AI, or try refreshing page

Q: Save function not working?\
A: Check storage permissions, clear extension data and retry

Q: Performance slow?\
A: Avoid processing overly long text simultaneously, use summary function first

Q: "AI features not available" error?\
A: Make sure you've enabled Gemini Nano in `chrome://flags` and restarted Chrome

### Debug Mode

javascript

``` bash
// Enable debug in console
localStorage.setItem('readbuddy_debug', 'true')

// View logs
chrome.runtime.sendMessage({action: 'getLogs'})
```

📄 License
----------

This project is licensed under the MIT License - see the [LICENSE](https://license/) file for details

🙏 Acknowledgments
------------------

-   Chrome team for built-in AI capabilities

-   Mozilla's Readability.js project

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

User Guide - Technical Docs - [Report Issues](https://github.com/Wilsomwong2004/readbuddy/issues)

</div>
