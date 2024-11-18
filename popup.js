// popup.js

// Function to display concerns in the popup
function displayConcerns(concerns) {
  const concernsContainer = document.getElementById('concerns-container');

  if (concernsContainer) {
    concernsContainer.innerHTML = ''; // Clear existing content

    if (concerns.length === 0) {
      concernsContainer.innerHTML = '<p>No concerns found.</p>';
    } else {
      concerns.forEach(concern => {
        const concernItem = document.createElement('div');
        concernItem.classList.add('concern-item');

        const titleElement = document.createElement('h5');
        titleElement.classList.add('concern-title');
        titleElement.textContent = concern.title;

        const descriptionElement = document.createElement('p');
        descriptionElement.classList.add('concern-description');
        descriptionElement.textContent = concern.description;

        concernItem.appendChild(titleElement);
        concernItem.appendChild(descriptionElement);
        concernsContainer.appendChild(concernItem);
      });
    }
  } else {
    console.error('concerns-container element is missing in the DOM.');
  }
}

// Listener for concerns from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayConcerns') {
    displayConcerns(message.concerns);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Retrieve concerns when popup is opened
  chrome.runtime.sendMessage({ action: 'getConcerns' }, (response) => {
    if (response && response.concerns) {
      displayConcerns(response.concerns);
    }
  });

  // Add event listener for the close button
  const closeButton = document.getElementById('close-btn');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      // Clear stored data
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing data:', chrome.runtime.lastError);
        } else {
          console.log('All data cleared from chrome.storage.local.');
        }
        // Close the popup
        window.close();
      });
    });
  } else {
    console.error('Close button not found');
  }
});