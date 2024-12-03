// popup.js

let totalChunks = 0;
let processedChunks = 0;
let concernsList = [];

document.addEventListener('DOMContentLoaded', () => {
  // Show loading indicator initially
  showLoadingIndicator();

  // Retrieve concerns when popup is opened
  chrome.runtime.sendMessage({ action: 'getConcerns' }, (response) => {
    if (response && response.concerns) {
      concernsList = response.concerns;
      displayConcerns(concernsList);
    } else {
      // If no concerns, start processing
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tabs[0].id },
              files: ['src/scripts/scraper.js'],
            },
            () => {
              if (chrome.runtime.lastError) {
                console.error('Error injecting scraper.js:', chrome.runtime.lastError);
                displayError('Failed to start analysis.');
              } else {
                console.log('scraper.js injected successfully.');
              }
            }
          );
        } else {
          displayError('No active tab found.');
        }
      });
    }
  });

  // Add event listener for the close button
  const closeButton = document.getElementById('close-btn');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      // Clear stored data
      chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
        window.close();
      });
    });
  } else {
    console.error('Close button not found');
  }
});

// Show loading indicator
function showLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  const concernsContainer = document.getElementById('concerns-container');
  const errorContainer = document.getElementById('error-container');
  const progressBarContainer = document.getElementById('progress-bar-container');
  const progressText = document.getElementById('progress-text');

  // Show loading indicator
  loadingIndicator.style.display = 'block';

  // Hide concerns and error container
  concernsContainer.style.display = 'none';
  errorContainer.style.display = 'none';

  // Show progress bar and text
  progressBarContainer.style.display = 'block';
  progressText.style.display = 'block';

  // Initialize progress bar
  updateProgress(0, 1); // Set initial progress to 0%
}

// Function to display concerns
function displayConcerns(concerns) {
  const concernsContainer = document.getElementById('concerns-container');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorContainer = document.getElementById('error-container');

  // Hide loading indicator and error container
  loadingIndicator.style.display = 'none';
  errorContainer.style.display = 'none';

  if (concernsContainer) {
    concernsContainer.style.display = 'block'; // Show the container
    concernsContainer.innerHTML = ''; // Clear existing content

    if (!concerns || concerns.length === 0) {
      concernsContainer.innerHTML = '<p>No concerns found.</p>';
    } else {
      concerns.forEach((concern) => {
        const concernItem = document.createElement('div');
        concernItem.classList.add('concern-item', 'mb-3', 'card');

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const sectionElement = document.createElement('h5');
        sectionElement.classList.add('card-title');
        sectionElement.textContent = concern.section || 'Section';

        const quoteElement = document.createElement('p');
        quoteElement.classList.add('card-text');
        quoteElement.innerHTML = `<strong>Quote:</strong> "${concern.quote}"`;

        const concernElement = document.createElement('p');
        concernElement.classList.add('card-text');
        concernElement.innerHTML = `<strong>Concern:</strong> ${concern.concern}`;

        cardBody.appendChild(sectionElement);
        cardBody.appendChild(quoteElement);
        cardBody.appendChild(concernElement);
        concernItem.appendChild(cardBody);
        concernsContainer.appendChild(concernItem);
      });
    }
  } else {
    console.error('concerns-container element is missing in the DOM.');
  }
}

// Function to display errors
function displayError(message) {
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorContainer = document.getElementById('error-container');
  const concernsContainer = document.getElementById('concerns-container');
  const progressBarContainer = document.getElementById('progress-bar-container');
  const progressText = document.getElementById('progress-text');

  // Hide loading indicator, concerns container, and progress bar
  loadingIndicator.style.display = 'none';
  concernsContainer.style.display = 'none';
  progressBarContainer.style.display = 'none';
  progressText.style.display = 'none';

  // Show error message
  errorContainer.style.display = 'block';
  errorContainer.textContent = message || 'An error occurred.';
}

// Function to update progress
function updateProgress(processed, total) {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  let percentage = 0;
  if (total > 0) {
    percentage = Math.floor((processed / total) * 100);
  }
  // Log values for debugging
  console.log(`Processed: ${processed}, Total: ${total}, Percentage: ${percentage}%`);

  // Ensure percentage is between 0 and 100
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;

  // Set width
  progressBar.style.width = `${percentage}%`;
  progressBar.setAttribute('aria-valuenow', percentage);
  progressText.textContent = `Processing ${processed} of ${total} chunks...`;
}

// Listener for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processingStarted') {
    totalChunks = message.totalChunks || 0;
    processedChunks = 0;
    concernsList = [];
    showLoadingIndicator();
    updateProgress(processedChunks, totalChunks);
  } else if (message.action === 'processingProgress') {
    totalChunks = message.totalChunks;
    processedChunks = message.processedChunks;
    updateProgress(processedChunks, totalChunks);
  } else if (message.action === 'updateConcerns') {
    concernsList = message.concerns || [];
    displayConcerns(concernsList);
  } else if (message.action === 'processingComplete') {
    displayConcerns(message.concerns);
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressText = document.getElementById('progress-text');
    progressBarContainer.style.display = 'none'; // Hide progress bar when complete
    progressText.style.display = 'none';
  } else if (message.action === 'processingError') {
    displayError(message.message);
  }
});
