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

function showQuickActions(textToPreserve) {
  if (!isEnabled) {
    console.log('Extension disabled — no tooltip shown.');
    return;
  }

  hideQuickActions();
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const currentSelectedText = selection.toString().trim();
  if (!currentSelectedText) return;
  
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
    </div>
  `;
  
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.top - 60}px`;
  tooltip.style.left = `${rect.left + (rect.width / 2) - 100}px`;
  tooltip.style.zIndex = '999999';
  
  document.body.appendChild(tooltip);
  
  const buttons = tooltip.querySelectorAll('button[data-action]');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = button.dataset.action;
      handleAction(action, preservedText);
    });
  });

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

async function handleAction(action, text) {
  hideQuickActions();
  
  if (!text) return;
  
  showLoadingIndicator();
   chrome.runtime.sendMessage({
    type: 'open-sidepanel',
    action,
    text
  });
  
  setTimeout(hideLoadingIndicator, 1000);
}

// async function callSidebar(action, text) {
//   const sidebar = document.getElementById('readbuddy-sidebar');
//   if (sidebar) {
//     sidebar.style.display = 'block'; 
//   } else {
//     console.warn('ReadBuddy sidebar not found');
//   }

//   const inputBox = document.querySelector('#readbuddy-sidebar textarea, #readbuddy-sidebar input');
//   if (inputBox) {
//     inputBox.value = text;
//     inputBox.dispatchEvent(new Event('input', { bubbles: true })); 
//   } else {
//     console.warn('No input box found inside ReadBuddy sidebar');
//   }

//   if (action) {
//     console.log(`Action: ${action}, text pasted into sidebar.`);
//   }

//   return text; 
// }

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
  
  const closeBtn = resultPanel.querySelector('.readbuddy-close');
  closeBtn.addEventListener('click', hideResult);
  
  const copyBtn = resultPanel.querySelector('.readbuddy-copy');
  copyBtn.addEventListener('click', () => copyToClipboard(content));
  
  const speakBtn = resultPanel.querySelector('.readbuddy-speak');
  speakBtn.addEventListener('click', () => speakText(content));
  
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

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    isReadBuddyActive = !isReadBuddyActive;
    showTemporaryMessage(`ReadBuddy ${isReadBuddyActive ? 'activated' : 'deactivated'}`);
  }
  
  if (e.key === 'Escape') {
    hideQuickActions();
    hideResult();
  }
});

console.log('ReadBuddy extension loaded successfully!');
isReadBuddyActive = true;