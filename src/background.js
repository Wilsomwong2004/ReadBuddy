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

