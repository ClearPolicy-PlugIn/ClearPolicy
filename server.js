// Load environment variables from .env
import { config } from 'dotenv';
import OpenAI from 'openai';  // Ensure OpenAI library is correctly installed
config();
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;  // Use environment port or default to 3000

// Middleware
app.use(cors());  // Enable CORS
app.use(bodyParser.json());  // Parse incoming JSON data
console.log(process.env.OPENAI_API_KEY); // Ensure the key is correctly logged

// Set up OpenAI API configuration with the API key from the .env file
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // Loaded from the .env file
});

// Token limits for each model
const TOKEN_LIMITS = {
    'gpt-4o-mini': { contextWindow: 128000, maxOutputTokens: 16384 },  // GPT-4o-mini
    'gpt-4o-2024-08-06': { contextWindow: 128000, maxOutputTokens: 16384 },  // Updated GPT-4o version
};

// Helper function to convert characters to tokens
const charsToTokens = (chars) => Math.ceil(chars / 4);

// Deduplication to avoid repetitive concerns
function deduplicateConcerns(concernsList) {
    const finalConcerns = [];
    concernsList.forEach(concern => {
        const alreadyExists = finalConcerns.some(existingConcern => 
            existingConcern.toLowerCase().includes(concern.toLowerCase())
        );
        if (!alreadyExists) {
            finalConcerns.push(concern);
        }
    });
    return finalConcerns;
}

// Summarize Terms of Use and avoid repeated concerns across chunks
async function summarizePolicy(termsText) {
    try {
        const model = 'gpt-4o-mini';
        const { contextWindow, maxOutputTokens } = TOKEN_LIMITS[model];

        const totalTokens = charsToTokens(termsText.length);
        const maxInputTokens = contextWindow - maxOutputTokens;
        const numChunks = Math.ceil(totalTokens / maxInputTokens);

        let concernsList = [];
        let previousConcerns = [];  // Track all previous concerns to avoid repetition

        // Process each chunk
        for (let i = 0; i < numChunks; i++) {
            const start = i * maxInputTokens * 4;
            const end = start + maxInputTokens * 4;
            const chunk = termsText.slice(start, end);

            console.log(`Summarizing chunk ${i + 1} of ${numChunks}...`);

            // Use previously identified concerns in the prompt
            const previousConcernsText = previousConcerns.length > 0 
                ? `Previously identified concerns: ${previousConcerns.join(', ')}. Please do not repeat them.`
                : `No concerns have been identified so far.`;

            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a legal expert specializing in identifying problematic clauses in Terms of Use documents.' },
                    {
                        role: 'user',
                        content: `You are a legal expert reviewing a Terms of Use document. 
                          Summarize in very simple language 2 bullet points only the **most critical and unique** concerns related to user rights or privacy. 
                          Focus on issues such as:
                          - Invasive or excessive data collection
                          - Privacy or security concerns
                          - Sharing data with third parties
                          - Clauses that restrict user rights
                          - Unusually long data retention periods
                          - Waiving important legal rights

                          here are the previous concerns you identified, do not repeat them in your next response

                          ${previousConcernsText}

                          **Provide the new concerns in short, distinct bullet points. Do not repeat any previously identified concerns. Keep it succinct and focused.**

                          Terms of Use chunk:
                          ${chunk}`
                    }
                ],
                max_tokens: maxOutputTokens,
                temperature: 0.7,
            });

            const chunkConcerns = completion.choices[0].message.content.trim();

            // Add new concerns and track them
            concernsList.push(chunkConcerns);
            previousConcerns.push(chunkConcerns);
        }

        // Perform deduplication to ensure final output is unique
        const uniqueConcerns = deduplicateConcerns(concernsList);

        return uniqueConcerns;  // Return the deduplicated concerns

    } catch (error) {
        console.error('Error with OpenAI API:', error);
        throw new Error('Failed to summarize the Terms of Use');
    }
}

// POST route to process the Terms of Use content
app.post('/process-terms', async (req, res) => {
    try {
        const termsContent = req.body.termsContent;

        if (!termsContent || termsContent.trim() === '') {
            console.error('No Terms of Use content provided');  // Log the error
            return res.status(400).json({ error: 'No Terms of Use content provided' });
        }

        console.log("Received Terms of Use content:", termsContent);  // Log the content

        // Summarize the content using OpenAI (or your summarization logic)
        const structuredConcerns = await summarizePolicy(termsContent);

        // Log the concerns returned by OpenAI
        console.log("Generated Concerns:", structuredConcerns);

        // Send back the structured concerns
        res.json({ concerns: structuredConcerns });
    } catch (error) {
        console.error('Error processing Terms of Use:', error);  // Log the error stack trace
        res.status(500).json({ error: 'Failed to process Terms of Use' });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
