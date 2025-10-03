chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('readbuddy-')) {
    // Open side panel and send action
    chrome.sidePanel.open({tabId: tab.id});
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: info.menuItemId.replace('readbuddy-', ''),
      text: info.selectionText
    });
  } 
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "THEME_CHANGE") {
    updateIcon(msg.isDark);
  }
});

function updateIcon(isDark) {
  const suffix = isDark ? "dark" : "light";
  chrome.action.setIcon({
    path: {
      "16": `icon/icon-${suffix}-16.png`,
      "48": `icon/icon-${suffix}-48.png`,
      "128": `icon/icon-${suffix}-128.png`
    }
  });
}

const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");
updateIcon(darkScheme.matches);

darkScheme.addEventListener("change", (e) => {
  updateIcon(e.matches);
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidepanel') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.sidePanel.open({tabId: tabs[0].id});
    });
  }
});

// Handle action click - open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({tabId: tab.id});
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background got message:", msg);
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === 'OPEN_SIDEBAR') {
//     chrome.runtime.sendMessage({ type: 'SHOW_SIDEBAR', ...message });
//   }
// });

