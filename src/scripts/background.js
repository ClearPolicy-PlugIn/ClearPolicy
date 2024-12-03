// background.js

let totalChunks = 0;
let processedChunks = 0;
let accumulatedConcerns = [];

// Function to chunk text into smaller pieces
function chunkText(text, maxChunkSize = 3000) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end > text.length) {
      end = text.length;
    } else {
      // Avoid splitting in the middle of a sentence
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start) {
        end = lastPeriod + 1;
      }
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

// Process a single chunk by sending it to the backend
async function processChunk(chunkContent) {
  console.log(`Sending chunk to backend for GPT processing. Chunk length: ${chunkContent.length} characters`);

  try {
    const response = await fetch('https://clearpolicy-backend.vercel.app/api/process-terms', { // Update this URL with live hosted provided
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunkContent }),
    });

    console.log('Received response from backend');
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers]);

    // Read response based on Content-Type
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log('Response data:', responseData); // Log the response body

    if (!response.ok) {
      // Log error
      console.error("Error from backend:", response.status, response.statusText);

      // Increment processedChunks
      processedChunks++;

      // Update popup with progress
      chrome.runtime.sendMessage({
        action: 'processingProgress',
        totalChunks: totalChunks,
        processedChunks: processedChunks,
      });

      // Check if all chunks are processed
      if (processedChunks === totalChunks) {
        // Store concerns in chrome.storage.local
        chrome.storage.local.set({ concerns: accumulatedConcerns }, () => {
          console.log("All concerns stored successfully.");

          // Inform the popup that processing is complete
          chrome.runtime.sendMessage({
            action: 'processingComplete',
            concerns: accumulatedConcerns,
          });
        });
      }

      // Return to proceed to next chunk
      return;
    }

    // Ensure responseData is an object
    if (typeof responseData !== 'object') {
      try {
        responseData = JSON.parse(responseData);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", responseData);

        // Increment processedChunks
        processedChunks++;

        // Update popup with progress
        chrome.runtime.sendMessage({
          action: 'processingProgress',
          totalChunks: totalChunks,
          processedChunks: processedChunks,
        });

        // Check if all chunks are processed
        if (processedChunks === totalChunks) {
          // Store concerns in chrome.storage.local
          chrome.storage.local.set({ concerns: accumulatedConcerns }, () => {
            console.log("All concerns stored successfully.");

            // Inform the popup that processing is complete
            chrome.runtime.sendMessage({
              action: 'processingComplete',
              concerns: accumulatedConcerns,
            });
          });
        }

        return;
      }
    }

    console.log("Chunk processing complete.");

    const concerns = responseData.concerns || [];

    if (concerns.length > 0) {
      accumulatedConcerns = accumulatedConcerns.concat(concerns);

      // Send updated concerns to the popup immediately
      chrome.runtime.sendMessage({
        action: 'updateConcerns',
        concerns: accumulatedConcerns,
      });
    }

    // Increment processedChunks
    processedChunks++;

    // Update popup with progress
    chrome.runtime.sendMessage({
      action: 'processingProgress',
      totalChunks: totalChunks,
      processedChunks: processedChunks,
    });

    // Check if all chunks are processed
    if (processedChunks === totalChunks) {
      // Store concerns in chrome.storage.local
      chrome.storage.local.set({ concerns: accumulatedConcerns }, () => {
        console.log("All concerns stored successfully.");

        // Inform the popup that processing is complete
        chrome.runtime.sendMessage({
          action: 'processingComplete',
          concerns: accumulatedConcerns,
        });
      });
    }
  } catch (error) {
    console.error("Error processing chunk content:", error);

    // Increment processedChunks
    processedChunks++;

    // Update popup with progress
    chrome.runtime.sendMessage({
      action: 'processingProgress',
      totalChunks: totalChunks,
      processedChunks: processedChunks,
    });

    // Check if all chunks are processed
    if (processedChunks === totalChunks) {
      // Store concerns in chrome.storage.local
      chrome.storage.local.set({ concerns: accumulatedConcerns }, () => {
        console.log("All concerns stored successfully.");

        // Inform the popup that processing is complete
        chrome.runtime.sendMessage({
          action: 'processingComplete',
          concerns: accumulatedConcerns,
        });
      });
    }

    // Do not display the error to the user; proceed to next chunk
  }
}

// Listener for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in background script:', message);

  if (message.action === 'processContent') {
    const allTermsContent = message.content;
    console.log(`Received content for processing. Length: ${allTermsContent.length} characters`);

    // Chunk the content
    const chunks = chunkText(allTermsContent, 10000); // Adjust chunk size as needed
    console.log(`Total chunks created: ${chunks.length}`);
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} length: ${chunk.length} characters`);
    });

    totalChunks = chunks.length;
    processedChunks = 0;
    accumulatedConcerns = [];

    // Inform the popup that processing has started
    chrome.runtime.sendMessage({ action: 'processingStarted', totalChunks: totalChunks });

    // Process chunks sequentially
    (async function processAllChunks() {
      for (const chunk of chunks) {
        console.log(`Processing chunk ${processedChunks + 1} of ${totalChunks}. Chunk length: ${chunk.length} characters`);
        await processChunk(chunk);
      }
    })();

    sendResponse({ status: 'processingStarted' });
    return true; // Keep the message channel open for async sendResponse

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
