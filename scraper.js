// Step 1: Find the "Terms of Use" link on the current page
function findTermsOfUseLinkAndFetchContent() {
    const termsKeywords = ["terms of use", "terms & conditions", "terms and conditions", "terms"];
    
    // Find all links on the page
    const links = document.querySelectorAll('a'); // Get all <a> elements
    console.log("Checking links on the page...");

    for (let link of links) {
        const linkText = link.innerText.toLowerCase().trim(); // Get the text content of the link
        const linkHref = link.getAttribute('href'); // Get the href attribute ONLY, do not use entire node

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
            console.log("Found a Terms of Use link with URL:", linkHref); // Only log the URL here, not the node
            
            // Step 2: Fetch the content from the found Terms of Use link
            fetchTextFromUrl(linkHref);  // Fetch the content of the URL
            
            break; // Stop after finding the first valid link
        }
    }
}

// Step 2: Fetch the text from the given URL and clean the unnecessary HTML
async function fetchTextFromUrl(url) {
    console.log(`Fetching content from URL: ${url}`); // Debugging to ensure the fetch call happens

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

        // Now we need to target the largest content block by counting text length in elements
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

            // Optionally split the content into smaller chunks if too long
            const maxLength = 5000; // Example max length for API request
            const contentChunks = splitTextIntoChunks(cleanText, maxLength);

            // Send the cleaned text to the server
            for (let chunk of contentChunks) {
                await sendTermsToServer(chunk);
            }

        } else {
            console.error('No significant content block found to extract.');
        }
    } catch (error) {
        console.error('There was a problem fetching or processing the Terms of Use content:', error);
    }
}

// Helper function to split text into smaller chunks
function splitTextIntoChunks(text, maxLength) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const chunk = text.substring(start, Math.min(start + maxLength, text.length));
        chunks.push(chunk);
        start += maxLength;
    }
    return chunks;
}

// Function to send the terms to the server
// Function to send the extracted terms content to the server
async function sendTermsToServer(cleanText) {
    try {
        const response = await fetch('http://localhost:3001/process-terms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ termsContent: cleanText }),
        });
        const data = await response.json();
        console.log("Response from server:", data); // Log the full response

        if (data.concerns) {
            console.log('Concerns from server:', data.concerns);
            
            // Send the concerns to the background script, which will store them
            chrome.runtime.sendMessage({
                action: 'displayConcerns',
                concerns: data.concerns,  // Ensure this contains the correct data
            });
        } else {
            console.error('Error: Concerns are undefined in the response');
        }

    } catch (error) {
        console.error('Error sending terms to server:', error);
    }
}

// Example usage: Call the function to start the process
findTermsOfUseLinkAndFetchContent();
