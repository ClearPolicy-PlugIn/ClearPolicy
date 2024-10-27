// Listener for concerns from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'displayConcerns') {
      // Insert the concerns into your popup's HTML
      const concernsDiv = document.getElementById('concerns-container'); // Ensure this ID matches your HTML

      if (concernsDiv) {
          concernsDiv.innerHTML = ''; // Clear existing content

          message.concerns.forEach(concern => {
              const concernItem = document.createElement('div');
              concernItem.innerHTML = `<p><strong>Chunk ${concern.chunk}:</strong> ${concern.concerns}</p>`;
              concernsDiv.appendChild(concernItem);
          });
      } else {
          console.error('Could not find concerns div.');
      }
  }
});

// Optional: You could have a trigger that requests the concerns when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ action: 'getConcerns' }, (response) => {
        if (response && response.concerns) {
            displayConcerns(response.concerns);
        }
    });
});

// Display concerns function (if triggered manually)
function displayConcerns(concerns) {
  const concernsContainer = document.getElementById('concerns-container');

  if (concernsContainer) {
      concernsContainer.innerHTML = ''; // Clear existing content

      concerns.forEach(item => {
          const concernItem = document.createElement('div');
          concernItem.innerHTML = `<p><strong>Chunk ${item.chunk}:</strong> ${item.concerns}</p>`;
          concernsContainer.appendChild(concernItem);
      });
  } else {
      console.error('concerns-container element is missing in the DOM.');
  }
}
