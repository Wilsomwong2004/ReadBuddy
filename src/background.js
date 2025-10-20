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

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('[Background] Extension installed, injecting content scripts...');
    await injectContentScriptsToAllTabs();
  } else if (details.reason === 'update') {
    console.log('[Background] Extension updated, re-injecting content scripts...');
    await injectContentScriptsToAllTabs();
  }
});

// Function to inject content scripts to all existing tabs
async function injectContentScriptsToAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      // Skip chrome:// and other protected URLs
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          });
          
          console.log(`[Background] Injected content script into tab ${tab.id}`);
        } catch (error) {
          console.log(`[Background] Could not inject into tab ${tab.id}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('[Background] Error injecting content scripts:', error);
  }
}

// Also re-inject when tab is updated (navigated)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('chrome-extension://')) {
    try {
      // Check if content script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => !!window.readBuddyInjected
      });
      
      if (!results || !results[0]?.result) {
        console.log(`[Background] Re-injecting content script into tab ${tabId}`);
        
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['content.css']
        });
      }
    } catch (error) {
      console.log(`[Background] Could not check/inject into tab ${tabId}:`, error.message);
    }
  }
});

