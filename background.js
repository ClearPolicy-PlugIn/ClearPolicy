// background.js

// Function to process terms content by sending it to your backend
async function processTermsContent(termsContent) {
  try {
    const response = await fetch('https://clearpolicy-backend.vercel.app/api/process-terms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ termsContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from backend:', errorData);
      throw new Error(`Backend error: ${errorData.error}`);
    }

    const data = await response.json();
    // Log the full GPT concerns response here
    console.log("Full GPT response received from backend:", data.concerns);

    const concerns = data.concerns;

    if (concerns) {
      console.log("Full concerns list received from backend:", concerns);

      // Retrieve existing concerns from storage
      chrome.storage.local.get(['concerns'], (result) => {
        let existingConcerns = result.concerns || [];

        // Append new concerns to existing ones
        const updatedConcerns = existingConcerns.concat(concerns);

        // Store updated concerns
        chrome.storage.local.set({ concerns: updatedConcerns }, () => {
          console.log('Concerns stored successfully.');

          // Notify popup to display concerns
          chrome.runtime.sendMessage({
            action: 'displayConcerns',
            concerns: updatedConcerns,
          });
        });
      });
    } else {
      console.error('No concerns received from backend.');
    }
  } catch (error) {
    console.error('Error processing terms content:', error);
    throw error;
  }
}

// Message listener for communication with content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processTerms') {
    // Receive terms content from scraper.js
    processTermsContent(message.termsContent)
      .then(() => {
        sendResponse({ status: 'success' });
      })
      .catch((error) => {
        console.error('Error processing terms content:', error);
        sendResponse({ status: 'error', message: error.message });
      });
    return true; // Keeps the message channel open for sendResponse
  } else if (message.action === 'getConcerns') {
    // Retrieve stored concerns
    chrome.storage.local.get(['concerns'], (result) => {
      sendResponse({ concerns: result.concerns });
    });
    return true;
  }
});