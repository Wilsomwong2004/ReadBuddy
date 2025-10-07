let isSettingShortcut = false;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "setting-shortcut-start") {
    isSettingShortcut = true;
    console.log("[commands] Shortcut setting started");
  } else if (message.type === "setting-shortcut-end") {
    isSettingShortcut = false;
    console.log("[commands] Shortcut setting ended");
  }
});

const COMMAND_ACTION_MAP = {
  'open-summarize': 'summarize',
  'open-translate': 'translate',
  'open-explain': 'explain',
  'open-chat': 'chat'
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('readbuddy-')) {
    chrome.sidePanel.open({tabId: tab.id});
    
    chrome.tabs.sendMessage(tab.id, {
      action: info.menuItemId.replace('readbuddy-', ''),
      text: info.selectionText
    });
  } 
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { isEnabled } = await chrome.storage.local.get("isEnabled");
  if (!isEnabled) {
    console.log("ReadBuddy disabled — blocked.");
    return;
  }
  
  if (info.menuItemId.startsWith("readbuddy-")) {
    chrome.sidePanel.open({ tabId: tab.id });
    chrome.tabs.sendMessage(tab.id, {
      action: info.menuItemId.replace("readbuddy-", ""),
      text: info.selectionText,
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (isSettingShortcut) {
    console.log("[commands] Ignored because user is setting shortcut");
    return;
  }

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
  console.log("[Background] Received message:", msg);
  console.log("[Background] Sender tab ID:", sender.tab?.id);
  
  if (msg.type === 'open-sidepanel') {
    console.log("[Background] Opening sidepanel for action:", msg.action);
    console.log("[Background] Text length:", msg.text?.length);
    
    chrome.sidePanel.open({tabId: sender.tab.id}, () => {
      console.log("[Background] Sidepanel opened, sending message after 200ms delay");
      
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'open-sidepanel',
          action: msg.action,
          text: msg.text
        }, (response) => {
          console.log("[Background] Message sent to sidepanel, response:", response);
        });
      }, 200);
    });
  }
  
  return true;
});


