// scraper.js

// Function to find and fetch all Terms content
async function findAndFetchAllTermsContent() {
  const termsKeywords = [
    "terms of use", "terms & conditions", "privacy policy",
    "user agreement", "terms", "privacy", "Privacy Policy", "Terms of Use"
  ];

  const links = Array.from(document.querySelectorAll('a'));
  console.log("Checking links on the page...");

  // Filter links based on keywords
  const matchedLinks = links.filter(link => {
    const linkText = link.innerText.toLowerCase().trim();
    const linkHref = link.getAttribute('href')?.toLowerCase() || "";
    return termsKeywords.some(keyword => linkText.includes(keyword) || linkHref.includes(keyword));
  });

  console.log(`Matched links count (before deduplication): ${matchedLinks.length}`);

  // Deduplicate links by URL
  const uniqueLinks = Array.from(
    new Set(
      matchedLinks.map(link => {
        const href = new URL(link.href);
        href.hash = ""; // Remove hash fragments
        return href.toString();
      })
    )
  ).map(url => matchedLinks.find(link => link.href.startsWith(url))); // Map back to original link elements

  console.log(`Unique links count (after deduplication): ${uniqueLinks.length}`);
  uniqueLinks.forEach((link, index) => {
    console.log(`Unique link ${index + 1}:`);
    console.log(` - Text: ${link.innerText.trim()}`);
    console.log(` - URL: ${link.href}`);
  });

  if (uniqueLinks.length === 0) {
    console.log("No Terms of Use or Privacy Policy links found.");
    chrome.runtime.sendMessage({
      action: 'processingError',
      message: 'No Terms of Use or Privacy Policy found on this page.'
    });
    return;
  }

  let allTermsContent = '';
  const fetchedContent = new Set(); // To check for redundant content

  for (const link of uniqueLinks) {
    try {
      console.log(`Fetching content from URL: ${link.href}`);
      const response = await fetch(link.href);
      if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

      const htmlContent = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      console.log(`Fetched HTML content length from ${link.href}: ${htmlContent.length} characters`);

      const cleanText = cleanExtractedText(doc);
      if (cleanText && !fetchedContent.has(cleanText)) {
        fetchedContent.add(cleanText); // Track unique content
        console.log(`Cleaned text content length from ${link.href}: ${cleanText.length} characters`);
        console.log(`Cleaned content preview (first 500 characters):\n${cleanText.slice(0, 500)}\n`);
        allTermsContent += cleanText + '\n';
      } else if (fetchedContent.has(cleanText)) {
        console.log(`Skipped redundant content from ${link.href}`);
      } else {
        console.log(`No content extracted from ${link.href}`);
      }
    } catch (error) {
      console.error("Error fetching or processing Terms of Use content:", error);
    }
  }

  console.log(`Total aggregated terms content length: ${allTermsContent.length} characters`);
  console.log(`Aggregated content preview (first 1000 characters):\n${allTermsContent.slice(0, 1000)}\n`);

  if (allTermsContent) {
    // Send the content to background script for processing
    chrome.runtime.sendMessage({ action: 'processContent', content: allTermsContent }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to background script:', chrome.runtime.lastError);
      } else {
        console.log('Processing started in background script.');
      }
    });
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
  const elementsToRemove = ['script', 'style', 'noscript', 'meta', 'link'];
  elementsToRemove.forEach(tag => doc.querySelectorAll(tag).forEach(element => element.remove()));

  const bodyText = doc.body.innerText.trim();
  console.log(`Cleaned body text length: ${bodyText.length} characters`);
  return bodyText || null;
}

// Start the process
findAndFetchAllTermsContent();
