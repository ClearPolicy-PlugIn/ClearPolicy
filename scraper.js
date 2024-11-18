// scraper.js

// Step 1: Find "Terms of Use" and "Privacy Policy" links and dynamically load content if needed
function findAndFetchAllTermsContent() {
  const termsKeywords = [
      "terms of use", "Terms of Use", "terms & conditions", "Terms & Conditions",
      "terms", "Terms", "Privacy Policy", "privacy policy", "Privacy", "privacy",
      "User Agreement", "user agreement"
  ];

  // Find all links on the page
  const links = Array.from(document.querySelectorAll('a'));
  console.log("Checking links on the page...");

  // Filter links that match any of the terms keywords
  const matchedLinks = links.filter(link => {
      const linkText = link.innerText.toLowerCase().trim();
      const linkHref = link.getAttribute('href')?.toLowerCase() || "";
      return termsKeywords.some(keyword => linkText.includes(keyword) || linkHref.includes(keyword));
  });

  // Fetch content for each matched link
  matchedLinks.forEach((link, index) => {
      console.log(`Processing link ${index + 1}: ${link.innerText} (URL: ${link.href})`);
      
      // If the link expands a dropdown or loads content, simulate a click
      if (link.getAttribute('aria-expanded') === 'false' || link.hasAttribute('data-dropdown-toggle')) {
          link.click(); // Simulate the click to open dropdown
          setTimeout(() => fetchTextFromExpandedContent(link.href), 1000); // Wait for content to load
      } else {
          fetchTextFromUrl(link.href);
      }
  });
}

// Function to handle content from dynamically expanded sections
async function fetchTextFromExpandedContent(url) {
  const contentContainer = document.querySelector('div[aria-expanded="true"]') || document.body;
  const expandedText = cleanExtractedText(contentContainer);
  if (expandedText) sendTermsToBackground(expandedText);
}

// Step 2: Fetch text from each URL, clean, and extract text
async function fetchTextFromUrl(url) {
  console.log(`Fetching content from URL: ${url}`);

  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

      const htmlContent = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      // Extract meaningful content
      const cleanText = cleanExtractedText(doc);
      if (cleanText) sendTermsToBackground(cleanText);
  } catch (error) {
      console.error("Error fetching or processing Terms of Use content:", error);
  }
}

// Helper to clean and extract text from a document node
function cleanExtractedText(doc) {
  const elementsToRemove = ['script', 'style', 'noscript', 'meta', 'link', 'header', 'footer', 'nav', 'aside'];
  elementsToRemove.forEach(tag => doc.querySelectorAll(tag).forEach(element => element.remove()));

  const contentBlocks = Array.from(doc.querySelectorAll('div, article, section, main'));
  const largestBlock = contentBlocks.reduce((largest, block) => block.innerText.length > largest.innerText.length ? block : largest, { innerText: "" });

  const cleanText = largestBlock.innerText.trim();
  console.log("Extracted and cleaned content:", cleanText);
  return cleanText || null;
}

// Send extracted content to background.js
function sendTermsToBackground(content) {
  chrome.runtime.sendMessage({ action: 'processTerms', termsContent: content }, response => {
      if (chrome.runtime.lastError) {
          console.error('Error sending message to background script:', chrome.runtime.lastError);
      } else {
          console.log('Received response from background script:', response);
      }
  });
}

// Start process
findAndFetchAllTermsContent();
