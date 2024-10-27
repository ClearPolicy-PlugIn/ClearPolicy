// When the server response is received
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayConcerns') {
      // Send a message to the popup to display concerns
      chrome.runtime.sendMessage({
          action: 'displayConcerns',
          concerns: message.concerns // Pass the concerns data here
      });
  }
});

// Store and handle concerns
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getConcerns') {
      // Logic to return concerns stored in chrome's local storage or a variable
      chrome.storage.local.get(['concerns'], (result) => {
          sendResponse({ concerns: result.concerns });
      });
      return true; // Ensures sendResponse is asynchronous
  }
});
