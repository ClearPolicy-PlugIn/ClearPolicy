// background.js

// Function to aggregate concerns by section title
function aggregateConcerns(concernsArray) {
  const aggregatedConcerns = {};

  concernsArray.forEach(concernChunk => {
    // If concernChunk is a string, parse it line-by-line
    if (typeof concernChunk === 'string') {
      const lines = concernChunk.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        // Match the format: "- **Title**: Description"
        const match = line.match(/^-\s*\*\*(.+?)\*\*:\s*(.+)$/);
        if (match) {
          const title = match[1];
          const description = match[2];

          // If the title exists, append the description; otherwise, create a new entry
          if (aggregatedConcerns[title]) {
            aggregatedConcerns[title] += "\n" + description;
          } else {
            aggregatedConcerns[title] = description;
          }
        } else {
          console.warn("Line did not match expected format:", line);
        }
      });
    } else if (Array.isArray(concernChunk)) {
      concernChunk.forEach(concern => {
        const { title, description } = concern;

        if (aggregatedConcerns[title]) {
          aggregatedConcerns[title] += "\n" + description;
        } else {
          aggregatedConcerns[title] = description;
        }
      });
    } else {
      console.warn('Unexpected format in concernsArray item, expected a string or array:', concernChunk);
    }
  });

  return Object.entries(aggregatedConcerns).map(([title, description]) => ({ title, description }));
}

// Process terms content by sending it to the backend for GPT processing
async function processTermsContent(termsContent) {
  console.log("Sending terms content to backend for GPT processing:", termsContent);
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
    console.log("Full GPT response received from backend:", data.concerns);

    const concerns = data.concerns;

    if (concerns) {
      chrome.storage.local.get(['concerns'], result => {
        const existingConcerns = result.concerns || [];
        const updatedConcerns = aggregateConcerns(existingConcerns.concat(concerns));

        chrome.storage.local.set({ concerns: updatedConcerns }, () => {
          console.log("Aggregated concerns stored successfully.");

          chrome.runtime.sendMessage({
            action: 'displayConcerns',
            concerns: updatedConcerns,
          });
        });
      });
    } else {
      console.error("No concerns received from backend.");
    }
  } catch (error) {
    console.error("Error processing terms content:", error);
    throw error;
  }
}

// Listener for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processTerms') {
    processTermsContent(message.termsContent)
      .then(() => sendResponse({ status: 'success' }))
      .catch(error => {
        console.error("Error processing terms content:", error);
        sendResponse({ status: 'error', message: error.message });
      });
    return true; // Keeps message channel open for async sendResponse
  } else if (message.action === 'getConcerns') {
    chrome.storage.local.get(['concerns'], result => sendResponse({ concerns: result.concerns }));
    return true;
  }
});