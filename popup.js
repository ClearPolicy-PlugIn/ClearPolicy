// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // Show loading indicator initially
  showLoadingIndicator();

  // Retrieve concerns when popup is opened
  chrome.runtime.sendMessage({ action: 'getConcerns' }, (response) => {
    if (response && response.concerns) {
      displayConcerns(response.concerns);
    } else {
      // If no concerns, start processing
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['scraper.js'],
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error injecting scraper.js:', chrome.runtime.lastError);
              displayError('Failed to start analysis.');
            } else {
              console.log('scraper.js injected successfully.');
            }
          });
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

  // Show loading indicator
  loadingIndicator.style.display = 'block';

  // Hide concerns and error container
  concernsContainer.style.display = 'none';
  errorContainer.style.display = 'none';
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
      concerns.forEach(concern => {
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

  // Hide loading indicator and concerns container
  loadingIndicator.style.display = 'none';
  concernsContainer.style.display = 'none';

  // Show error message
  errorContainer.style.display = 'block';
  errorContainer.textContent = message || 'An error occurred.';
}

// Listener for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processingStarted') {
    showLoadingIndicator();
  } else if (message.action === 'processingComplete') {
    displayConcerns(message.concerns);
  } else if (message.action === 'processingError') {
    displayError(message.message);
  }
});
