// scraper.js

// Function to find and fetch all Terms content
async function findAndFetchAllTermsContent() {
  const termsKeywords = [
    "terms of use", "terms & conditions", "privacy policy",
    "user agreement", "terms", "privacy", "Privacy Policy"
  ];

  const links = Array.from(document.querySelectorAll('a'));
  console.log("Checking links on the page...");

  const matchedLinks = links.filter(link => {
    const linkText = link.innerText.toLowerCase().trim();
    const linkHref = link.getAttribute('href')?.toLowerCase() || "";
    return termsKeywords.some(keyword => linkText.includes(keyword) || linkHref.includes(keyword));
  });

  if (matchedLinks.length === 0) {
    console.log("No Terms of Use or Privacy Policy links found.");
    displayFloatingWidget('No Terms of Use or Privacy Policy found on this page.', true);
    return;
  }

  let allTermsContent = '';

  for (const link of matchedLinks) {
    try {
      console.log(`Fetching content from URL: ${link.href}`);
      const response = await fetch(link.href);
      if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

      const htmlContent = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      const cleanText = cleanExtractedText(doc);
      if (cleanText) {
        allTermsContent += cleanText + '\n';
      }
    } catch (error) {
      console.error("Error fetching or processing Terms of Use content:", error);
    }
  }

  if (allTermsContent) {
    // Show loading widget
    displayFloatingWidget('Analyzing Terms of Use...', false, true);

    sendTermsToBackground(allTermsContent);
  } else {
    console.error("No Terms content extracted.");
    displayFloatingWidget('Failed to extract Terms of Use content.', true);
  }
}

// Helper to clean and extract text from a document node
function cleanExtractedText(doc) {
  const elementsToRemove = ['script', 'style', 'noscript', 'meta', 'link', 'header', 'footer', 'nav', 'aside'];
  elementsToRemove.forEach(tag => doc.querySelectorAll(tag).forEach(element => element.remove()));

  const contentBlocks = Array.from(doc.querySelectorAll('div, article, section, main'));
  const largestBlock = contentBlocks.reduce((largest, block) => {
    return block.innerText.length > largest.innerText.length ? block : largest;
  }, { innerText: "" });

  const cleanText = largestBlock.innerText.trim();
  return cleanText || null;
}

// Send extracted content to background.js
function sendTermsToBackground(content) {
  chrome.runtime.sendMessage({ action: 'processTerms', termsContent: content }, response => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message to background script:', chrome.runtime.lastError);
    } else {
      console.log('Processing started in background script.');
    }
  });
}

// Function to display the floating widget
function displayFloatingWidget(message, isError = false, isLoading = false) {
  let widget = document.getElementById('clearpolicy-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'clearpolicy-widget';
    widget.innerHTML = `
      <div class="cp-widget-content">
        <button class="cp-widget-close">&times;</button>
        <div class="cp-widget-body">
          <div class="cp-widget-loading" style="display: none;">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p>Analyzing Terms of Use...</p>
          </div>
          <div class="cp-widget-message"></div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // Load CSS
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('widget.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add event listener for close button
    widget.querySelector('.cp-widget-close').addEventListener('click', () => {
      widget.style.display = 'none';
    });
  }

  const loadingElement = widget.querySelector('.cp-widget-loading');
  const messageElement = widget.querySelector('.cp-widget-message');

  if (isLoading) {
    loadingElement.style.display = 'block';
    messageElement.style.display = 'none';
  } else {
    loadingElement.style.display = 'none';
    messageElement.style.display = 'block';
    messageElement.textContent = message;
    if (isError) {
      messageElement.classList.add('text-danger');
    } else {
      messageElement.classList.remove('text-danger');
    }
  }

  widget.style.display = 'block';
}

// Listener for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processingComplete') {
    // Display concerns in the widget
    displayConcernsInWidget(message.concerns);
  } else if (message.action === 'processingError') {
    displayFloatingWidget(message.message, true);
  } else if (message.action === 'processingStarted') {
    displayFloatingWidget('Analyzing Terms of Use...', false, true);
  }
});

// Function to display concerns in the widget
function displayConcernsInWidget(concerns) {
  let widget = document.getElementById('clearpolicy-widget');
  if (!widget) return;

  const loadingElement = widget.querySelector('.cp-widget-loading');
  const messageElement = widget.querySelector('.cp-widget-message');

  loadingElement.style.display = 'none';
  messageElement.style.display = 'block';
  messageElement.innerHTML = ''; // Clear previous content

  if (!concerns || concerns.length === 0) {
    messageElement.innerHTML = '<p>No concerns found.</p>';
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
      messageElement.appendChild(concernItem);
    });
  }
}

// Start the process
findAndFetchAllTermsContent();