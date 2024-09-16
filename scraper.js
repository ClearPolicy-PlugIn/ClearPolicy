const axios = require('axios');
const cheerio = require('cheerio');

// Keywords to search for in anchor tags or headings (focused on privacy)
const keywords = /privacy|policy/i;

// Function to fetch and scrape the page
async function scrapePage(url) {
    try {
        // Fetch the webpage HTML
        const { data } = await axios.get(url);

        // Load the HTML into cheerio for DOM parsing
        const $ = cheerio.load(data);

        // Search for anchor tags that contain "privacy" related links
        let detectedLinks = [];
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            const text = $(link).text().trim();

            if (keywords.test(href) || keywords.test(text)) {
                detectedLinks.push({ href, text });
            }
        });

        console.log("Detected privacy-related links:");
        console.log(detectedLinks);

        // Extract content specifically related to "Privacy Policy"
        let policyContent = '';
        $('*').each((i, elem) => {
            const tagText = $(elem).text().trim();
            if (keywords.test(tagText)) {
                // Look for content in headings and collect paragraphs/sibling elements
                policyContent += tagText + '\n';
                $(elem).nextUntil('h1, h2, h3, h4').each((j, sibling) => {
                    policyContent += $(sibling).text().trim() + '\n';
                });
            }
        });

        if (policyContent) {
            console.log("\nExtracted Privacy Policy Content:\n");
            console.log(policyContent);
        } else {
            console.log("No privacy policy content found.");
        }

    } catch (error) {
        console.error(`Error fetching the page: ${error}`);
    }
}

// For testing purposes, you can replace this URL with any target page
const testURL = "https://help.netflix.com/en/node/112419";
scrapePage(testURL);