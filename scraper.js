// scraper.js

// Step 1: Find the "Terms of Use" link on the current page
function findTermsOfUseLinkAndFetchContent() {
    const termsKeywords = ["terms of use", "Terms of Use", "terms & conditions","Terms & Conditions", "Terms", "terms", "Privacy Policy", "privacy policy", "Privacy", "privacy"];
  
    // Find all links on the page
    const links = document.querySelectorAll('a');
    console.log("Checking links on the page...");
  
    for (let link of links) {
      const linkText = link.innerText.toLowerCase().trim();
      const linkHref = link.getAttribute('href');
  
      // Skip if href is missing
      if (!linkHref) continue;
  
      // Log each link being processed for debugging purposes
      console.log(`Processing link: ${linkText} (URL: ${linkHref})`);
  
      // Check if the link text or href contains any keywords related to terms of use
      if (
        termsKeywords.some(keyword => linkText.includes(keyword)) ||
        termsKeywords.some(keyword => linkHref.toLowerCase().includes(keyword))
      ) {
        console.log('The function was called');
        console.log("Found a Terms of Use link with URL:", linkHref);
  
        // Step 2: Fetch the content from the found Terms of Use link
        fetchTextFromUrl(linkHref);
        break; // Stop after finding the first valid link
      }
    }
  }
  
  // Step 2: Fetch the text from the given URL and clean the unnecessary HTML
  async function fetchTextFromUrl(url) {
    console.log(`Fetching content from URL: ${url}`);
  
    try {
      // Convert the URL to an absolute URL if it's relative
      const fullUrl = new URL(url, window.location.origin);
  
      const response = await fetch(fullUrl); // Fetch the content from the URL
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
  
      const htmlContent = await response.text(); // Convert response to text
  
      // Create a temporary DOM element to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
  
      // Remove unnecessary elements like <script>, <style>, and metadata
      const elementsToRemove = ['script', 'style', 'noscript', 'meta', 'link', 'header', 'footer', 'nav', 'aside'];
      elementsToRemove.forEach(tag => {
        const elements = doc.querySelectorAll(tag);
        elements.forEach(element => element.remove());
      });
  
      // Target the largest content block by counting text length in elements
      const allDivs = Array.from(doc.querySelectorAll('div, article, section, main'));
      let largestBlock = null;
      let largestTextLength = 0;
  
      allDivs.forEach(div => {
        const textContent = div.innerText.trim();
        if (textContent.length > largestTextLength) {
          largestBlock = div;
          largestTextLength = textContent.length;
        }
      });
  
      if (largestBlock) {
        const cleanText = largestBlock.innerText.trim(); // Extract text from the largest block
        console.log("Cleaned Terms of Use text content:", cleanText);
  
        // Send the cleaned text to the background script
        sendTermsToBackground(cleanText);
      } else {
        console.error('No significant content block found to extract.');
      }
    } catch (error) {
      console.error('There was a problem fetching or processing the Terms of Use content:', error);
    }
  }
  
  // Function to send the terms content to the background script
  function sendTermsToBackground(cleanText) {
    chrome.runtime.sendMessage({
      action: 'processTerms',
      termsContent: cleanText,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to background script:', chrome.runtime.lastError);
      } else {
        console.log('Received response from background script:', response);
      }
    });
  }
  
  // Start the process
  findTermsOfUseLinkAndFetchContent();
  