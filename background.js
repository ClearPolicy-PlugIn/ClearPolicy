// background.js

// Helper function to send messages safely
function sendMessageToContentScript(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Error sending message to content script:', chrome.runtime.lastError);
    } else {
      // Handle response if necessary
    }
  });
}

// Process terms content by sending it to the backend for GPT processing
async function processTermsContent(termsContent, tabId) {
  console.log("Sending terms content to backend for GPT processing.");

  // Inform the popup that processing has started
  chrome.runtime.sendMessage({ action: 'processingStarted' });

  try {
    const response = await fetch('https://clearpolicy-backend.vercel.app/api/process-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termsContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from backend:", errorData);
      throw new Error(`Backend error: ${errorData.error}`);
    }

    const data = await response.json();
    console.log("Full GPT response received from backend.");

    const concerns = data.concerns;

    if (concerns && concerns.length > 0) {
      // Store concerns in chrome.storage.local
      chrome.storage.local.set({ concerns }, () => {
        console.log("Concerns stored successfully.");

        // Inform the popup that processing is complete
        chrome.runtime.sendMessage({
          action: 'processingComplete',
          concerns: concerns,
        });
      });
    } else {
      console.error("No concerns received from backend.");
      chrome.runtime.sendMessage({
        action: 'processingError',
        message: 'No concerns found in the Terms of Use.',
      });
    }
  } catch (error) {
    console.error("Error processing terms content:", error);
    chrome.runtime.sendMessage({
      action: 'processingError',
      message: error.message || 'An error occurred while processing.',
    });
  }
}

// Listener for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processTerms') {
    const tabId = sender.tab.id;
    processTermsContent(message.termsContent, tabId);
    sendResponse({ status: 'processingStarted' });
    return true;
  } else if (message.action === 'getConcerns') {
    // Retrieve concerns from storage and send them back
    chrome.storage.local.get('concerns', (result) => {
      sendResponse({ concerns: result.concerns });
    });
    return true; // Keep the message channel open for sendResponse
  } else if (message.action === 'clearData') {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing data:', chrome.runtime.lastError);
      } else {
        console.log('All data cleared from chrome.storage.local.');
      }
      sendResponse({ status: 'dataCleared' });
    });
    return true;
  }
});
