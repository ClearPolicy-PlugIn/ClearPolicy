// Append new concerns to the existing list in chrome.storage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'storeConcerns') {
      chrome.storage.local.get('concerns', (data) => {
          const currentConcerns = data.concerns || [];  // Get existing concerns or an empty array
          const updatedConcerns = [...currentConcerns, ...message.concerns];  // Append new concerns

          // Save the updated concerns back to storage
          chrome.storage.local.set({ concerns: updatedConcerns }, () => {
              console.log('Concerns updated in storage:', updatedConcerns);
          });
      });
  }
});

// Listen for popup requests to retrieve stored concerns
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getConcerns') {
      chrome.storage.local.get('concerns', (data) => {
          sendResponse(data.concerns || []);
      });
      return true;  // Indicates that the response will be asynchronous
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openResults') {
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html') });
  }
});ç