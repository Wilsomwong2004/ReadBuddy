import './content.css'

let selectedText = '';
let isReadBuddyActive = false;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  if (selectedText && selectedText.length > 10) {
    showQuickActions(selectedText);
  } else {
    hideQuickActions();
  }
});

// Quick action tooltip
function showQuickActions(textToPreserve) {
  hideQuickActions();
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const currentSelectedText = selection.toString().trim();
  if (!currentSelectedText) return;
  
  // Use the preserved text or current selection
  const preservedText = textToPreserve || currentSelectedText;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  const tooltip = document.createElement('div');
  tooltip.id = 'readbuddy-tooltip';
  tooltip.innerHTML = `
    <div class="readbuddy-actions">
      <button data-action="summarize" title="Summarize">📄</button>
      <button data-action="translate" title="Translate">🌐</button>
      <button data-action="explain" title="Explain">💡</button>
      <button data-action="define" title="Define">📖</button>
      <button data-action="simplify" title="Simplify">✨</button>
    </div>
  `;
  
  // Position tooltip near selection
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.top - 60}px`;
  tooltip.style.left = `${rect.left + (rect.width / 2) - 100}px`;
  tooltip.style.zIndex = '999999';
  
  document.body.appendChild(tooltip);
  
  // Add event listeners to buttons
  const buttons = tooltip.querySelectorAll('button[data-action]');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = button.dataset.action;
      handleAction(action, preservedText);
    });
  });
  
  // Hide tooltip when clicking elsewhere
  setTimeout(() => {
    document.addEventListener('click', hideTooltipOnClickOutside, true);
  }, 100);
}

function hideQuickActions() {
  const existingTooltip = document.getElementById('readbuddy-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  document.removeEventListener('click', hideTooltipOnClickOutside, true);
}

function hideTooltipOnClickOutside(e) {
  const tooltip = document.getElementById('readbuddy-tooltip');
  if (tooltip && !tooltip.contains(e.target)) {
    hideQuickActions();
  }
}

// Handle different actions
async function handleAction(action, text) {
  hideQuickActions();
  
  if (!text) return;
  
  // Show loading indicator
  showLoadingIndicator();
  
  try {
    switch (action) {
      case 'summarize':
        await summarizeText(text);
        break;
      case 'translate':
        await translateText(text);
        break;
      case 'explain':
        await explainText(text);
        break;
      case 'define':
        await defineText(text);
        break;
      case 'simplify':
        await simplifyText(text);
        break;
      default:
        console.log('Unknown action:', action);
    }
  } catch (error) {
    console.error('Error handling action:', error);
    showErrorMessage('An error occurred while processing your request.');
  } finally {
    hideLoadingIndicator();
  }
}

// Action implementations
async function summarizeText(text) {
  const result = await callAI('summarize', text);
  showResult('Summary', result);
}

async function translateText(text) {
  // Detect language and translate to English by default
  const result = await callAI('translate', text);
  showResult('Translation', result);
}

async function explainText(text) {
  const result = await callAI('explain', text);
  showResult('Explanation', result);
}

async function defineText(text) {
  const result = await callAI('define', text);
  showResult('Definition', result);
}

async function simplifyText(text) {
  const result = await callAI('simplify', text);
  showResult('Simplified', result);
}

// AI API call (you'll need to implement this based on your chosen AI service)
async function callAI(action, text) {
  // This is a placeholder - replace with your actual AI API call
  // You might use OpenAI, Claude, or another AI service
  
  const prompts = {
    summarize: `Please summarize the following text in 2-3 sentences:\n\n${text}`,
    translate: `Please translate the following text to English (if it's not already in English, if it is, translate to Spanish):\n\n${text}`,
    explain: `Please explain the following text in simple terms:\n\n${text}`,
    define: `Please define or explain the key terms/concepts in the following text:\n\n${text}`,
    simplify: `Please rewrite the following text in simpler language that's easier to understand:\n\n${text}`
  };
  
  // Example using fetch to call an AI API
  // Replace this with your actual API endpoint and key
  const response = await fetch('YOUR_AI_API_ENDPOINT', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      prompt: prompts[action],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error('API request failed');
  }
  
  const data = await response.json();
  return data.choices[0].text.trim(); // Adjust based on your API response format
}

// UI feedback functions
function showLoadingIndicator() {
  const loader = document.createElement('div');
  loader.id = 'readbuddy-loader';
  loader.innerHTML = `
    <div class="readbuddy-spinner">
      <div class="spinner"></div>
      <span>Processing...</span>
    </div>
  `;
  loader.style.position = 'fixed';
  loader.style.top = '20px';
  loader.style.right = '20px';
  loader.style.zIndex = '1000000';
  
  document.body.appendChild(loader);
}

function hideLoadingIndicator() {
  const loader = document.getElementById('readbuddy-loader');
  if (loader) {
    loader.remove();
  }
}

function showResult(title, content) {
  // Remove any existing result
  hideResult();
  
  const resultPanel = document.createElement('div');
  resultPanel.id = 'readbuddy-result';
  resultPanel.innerHTML = `
    <div class="readbuddy-result-panel">
      <div class="readbuddy-result-header">
        <h3>${title}</h3>
        <button class="readbuddy-close" title="Close">×</button>
      </div>
      <div class="readbuddy-result-content">
        <p>${content}</p>
      </div>
      <div class="readbuddy-result-actions">
        <button class="readbuddy-copy" title="Copy to clipboard">Copy</button>
        <button class="readbuddy-speak" title="Read aloud">🔊</button>
      </div>
    </div>
  `;
  
  resultPanel.style.position = 'fixed';
  resultPanel.style.top = '20px';
  resultPanel.style.right = '20px';
  resultPanel.style.zIndex = '1000000';
  resultPanel.style.maxWidth = '400px';
  
  document.body.appendChild(resultPanel);
  
  // Add event listeners
  const closeBtn = resultPanel.querySelector('.readbuddy-close');
  closeBtn.addEventListener('click', hideResult);
  
  const copyBtn = resultPanel.querySelector('.readbuddy-copy');
  copyBtn.addEventListener('click', () => copyToClipboard(content));
  
  const speakBtn = resultPanel.querySelector('.readbuddy-speak');
  speakBtn.addEventListener('click', () => speakText(content));
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideResult();
  }, 10000);
}

function hideResult() {
  const result = document.getElementById('readbuddy-result');
  if (result) {
    result.remove();
  }
}

function showErrorMessage(message) {
  const errorPanel = document.createElement('div');
  errorPanel.id = 'readbuddy-error';
  errorPanel.innerHTML = `
    <div class="readbuddy-error-panel">
      <span class="readbuddy-error-icon">⚠️</span>
      <span>${message}</span>
      <button class="readbuddy-close" title="Close">×</button>
    </div>
  `;
  
  errorPanel.style.position = 'fixed';
  errorPanel.style.top = '20px';
  errorPanel.style.right = '20px';
  errorPanel.style.zIndex = '1000000';
  
  document.body.appendChild(errorPanel);
  
  const closeBtn = errorPanel.querySelector('.readbuddy-close');
  closeBtn.addEventListener('click', () => errorPanel.remove());
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (document.body.contains(errorPanel)) {
      errorPanel.remove();
    }
  }, 5000);
}

// Utility functions
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showTemporaryMessage('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  } else {
    showErrorMessage('Text-to-speech is not supported in this browser.');
  }
}

function showTemporaryMessage(message) {
  const msgElement = document.createElement('div');
  msgElement.textContent = message;
  msgElement.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    z-index: 1000001;
    font-size: 14px;
  `;
  
  document.body.appendChild(msgElement);
  
  setTimeout(() => {
    if (document.body.contains(msgElement)) {
      msgElement.remove();
    }
  }, 2000);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+R to toggle ReadBuddy
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    isReadBuddyActive = !isReadBuddyActive;
    showTemporaryMessage(`ReadBuddy ${isReadBuddyActive ? 'activated' : 'deactivated'}`);
  }
  
  // Escape to hide any open panels
  if (e.key === 'Escape') {
    hideQuickActions();
    hideResult();
  }
});

// Initialize ReadBuddy
console.log('ReadBuddy extension loaded successfully!');
isReadBuddyActive = true;