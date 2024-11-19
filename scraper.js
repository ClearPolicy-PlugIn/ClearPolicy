// scraper.js

// Function to find and fetch all Terms content
async function findAndFetchAllTermsContent() {
  const termsKeywords = [
    "terms of use", "terms & conditions", "privacy policy",
    "user agreement", "terms", "privacy", "Privacy Policy", "Terms of Use"
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
    // No UI to update, so simply return
    chrome.runtime.sendMessage({
      action: 'processingError',
      message: 'No Terms of Use or Privacy Policy found on this page.'
    });
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
    // Send terms content to the background script for processing
    sendTermsToBackground(allTermsContent);
  } else {
    console.error("No Terms content extracted.");
    chrome.runtime.sendMessage({
      action: 'processingError',
      message: 'Failed to extract Terms of Use content.'
    });
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

// Start the process
findAndFetchAllTermsContent();
