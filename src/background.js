const COMMAND_ACTION_MAP = {
  'open-summarize': 'summarize',
  'open-translate': 'translate',
  'open-explain': 'explain',
  'open-chat': 'chat'
};

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
  console.log("[commands] Triggered command:", command);

  const action = COMMAND_ACTION_MAP[command];
  
  if (!action) {
    console.log("[commands] Unknown command:", command);
    return;
  }
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) {
      console.log("[commands] No active tab found");
      return;
    }
    const tabId = tabs[0].id;
    console.log("[commands] Found active tabId:", tabId);

    chrome.sidePanel.open({tabId: tabId}, () => {
      console.log("[commands] sidePanel.open called for tab:", tabId);

      setTimeout(() => { 
        console.log("[commands] Sending runtime message with action:", action);
        chrome.runtime.sendMessage({
          type: 'open-sidepanel-from-command', 
          action: action
        });
      }, 50); 
    });
  });
});


// Handle action click - open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({tabId: tab.id});
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background got message:", msg);
  
  if (msg.type === 'open-sidepanel') {
    chrome.sidePanel.open({tabId: sender.tab.id}, () => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'open-sidepanel',
          action: msg.action,
          text: msg.text
        });
      }, 200);
    });
  }
});


