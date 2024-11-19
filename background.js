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

  // Inform the content script that processing has started
  sendMessageToContentScript(tabId, { action: 'processingStarted' });

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
      // Store concerns in chrome.storage.local if needed
      chrome.storage.local.set({ concerns }, () => {
        console.log("Concerns stored successfully.");

        // Inform the content script that processing is complete
        sendMessageToContentScript(tabId, {
          action: 'processingComplete',
          concerns: concerns,
        });
      });
    } else {
      console.error("No concerns received from backend.");
      sendMessageToContentScript(tabId, {
        action: 'processingError',
        message: 'No concerns found in the Terms of Use.',
      });
    }
  } catch (error) {
    console.error("Error processing terms content:", error);
    sendMessageToContentScript(tabId, {
      action: 'processingError',
      message: error.message || 'An error occurred while processing.',
    });
  }
}

// Listener for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processTerms') {
    const tabId = sender.tab.id;
    processTermsContent(message.termsContent, tabId);
    sendResponse({ status: 'processingStarted' });
    return true;
  }
});