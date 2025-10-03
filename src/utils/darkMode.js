export const loadDarkMode = (callback) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['darkMode'], (result) => {
      const isDark = result.darkMode === true;
      applyDarkMode(isDark);
      if (callback) callback(isDark);
    });
  }
};

export const saveDarkMode = (isDark) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
     chrome.storage.local.set({ darkMode: isDark }, () => {
      chrome.runtime.sendMessage({ type: 'darkModeChanged', darkMode: isDark });
    });
  }
};

export const applyDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
};

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'darkModeChanged') {
      applyDarkMode(message.darkMode);
    }
  });
}