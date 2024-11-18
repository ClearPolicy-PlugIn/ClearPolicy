// background.js

// Process terms content by sending it to the backend for GPT processing
async function processTermsContent(termsContent) {
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

// Listener for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processTerms') {
    processTermsContent(message.termsContent);
    sendResponse({ status: 'processingStarted' });
    return true;
  } else if (message.action === 'getConcerns') {
    chrome.storage.local.get(['concerns'], result => {
      sendResponse({ concerns: result.concerns });
    });
    return true;
  }
});
