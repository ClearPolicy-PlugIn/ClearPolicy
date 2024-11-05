// Function to display concerns in the popup
function displayConcerns(concerns) {
  const concernsContainer = document.getElementById('concerns-container');
  
  if (concernsContainer) {
      concernsContainer.innerHTML = '';  // Clear existing content

      if (concerns.length > 0) {
          // Add each concern to the container
          concerns.forEach(item => {
              const concernItem = document.createElement('p');
              concernItem.textContent = item;  // Display the concern as plain text
              concernsContainer.appendChild(concernItem);
          });
      } else {
          // If no concerns are found, display a message
          concernsContainer.innerHTML = '<p>No concerns found.</p>';
      }
  } else {
      console.error('concerns-container not found in the DOM.');
  }
}

// Fetch and display concerns when the popup opens
window.onload = function () {
    chrome.storage.local.get({ concerns: [] }, (result) => {
        displayConcerns(result.concerns);  // Call the display function
    });
};
