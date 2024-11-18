// Initialize Materialize components
document.addEventListener('DOMContentLoaded', function () {
  const selects = document.querySelectorAll('select');
  M.FormSelect.init(selects);
});

// Function to display concerns in the popup
function displayConcerns(concerns) {
  const concernsContainer = document.getElementById('concerns-container');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorContainer = document.getElementById('error-container');

  // Hide loading indicator and error container
  loadingIndicator.style.display = 'none';
  errorContainer.style.display = 'none';

  if (concernsContainer) {
    concernsContainer.innerHTML = ''; // Clear existing content

    if (concerns.length === 0) {
      concernsContainer.innerHTML = '<p class="center-align">No concerns found.</p>';
    } else {
      concerns.forEach(concern => {
        const concernItem = document.createElement('div');
        concernItem.classList.add('card-panel', 'teal', 'lighten-4', 'concern-item');

        const titleElement = document.createElement('h6');
        titleElement.classList.add('concern-title');
        titleElement.textContent = concern.title;

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
  }
}

// Update the overview counts dynamically
function updateOverview(concerns) {
  document.getElementById('critical-count').textContent = concerns.filter(c => c.severity === 'critical').length;
  document.getElementById('moderate-count').textContent = concerns.filter(c => c.severity === 'moderate').length;
  document.getElementById('data-collection-count').textContent = concerns.filter(c => c.category === 'data-collection').length;
  document.getElementById('user-rights-count').textContent = concerns.filter(c => c.category === 'user-rights').length;
}

// Fetch and display concerns when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getConcerns' }, (response) => {
    if (response && response.concerns) {
      const concerns = response.concerns;

      // Update the overview counts
      updateOverview(concerns);

      // Display concerns
      displayConcerns(concerns);

      // Add filtering functionality
      const filterSelect = document.getElementById('filter');
      filterSelect.addEventListener('change', () => {
        const filterValue = filterSelect.value;
        const filteredConcerns = filterValue === 'all'
          ? concerns
          : concerns.filter(c => c.category === filterValue || c.severity === filterValue);
        displayConcerns(filteredConcerns);
      });

      // Add sorting functionality
      const sortSelect = document.getElementById('sort');
      sortSelect.addEventListener('change', () => {
        const sortValue = sortSelect.value;
        const sortedConcerns = [...concerns];

        if (sortValue === 'severity') {
          sortedConcerns.sort((a, b) => b.severityLevel - a.severityLevel);
        } else if (sortValue === 'category') {
          sortedConcerns.sort((a, b) => a.category.localeCompare(b.category));
        }
        displayConcerns(sortedConcerns);
      });
    }
  });

  // Add event listener for the close button
  const closeButton = document.getElementById('close-btn');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          console.error('Error clearing data:', chrome.runtime.lastError);
        } else {
          console.log('All data cleared from chrome.storage.local.');
        }
        window.close();
      });
    });
  } else {
    console.error('Close button not found');
  }
});
