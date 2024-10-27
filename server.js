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

// Function to summarize the Terms of Use or privacy policy
async function summarizePolicy(termsText) {
    try {
      const model = 'gpt-4o-mini';  // You can choose the model version
      const { contextWindow, maxOutputTokens } = TOKEN_LIMITS[model];  // Use token limits for the model
  
      // Calculate total tokens for the input text
      const totalTokens = charsToTokens(termsText.length);
  
      // Determine how many chunks are needed based on the context window
      const maxInputTokens = contextWindow - maxOutputTokens;
      const numChunks = Math.ceil(totalTokens / maxInputTokens);
  
      let concernsList = [];
  
      // Split the text into chunks and make multiple API calls
      for (let i = 0; i < numChunks; i++) {
        const start = i * maxInputTokens * 4;
        const end = start + maxInputTokens * 4;
        const chunk = termsText.slice(start, end);
  
        console.log(`Summarizing chunk ${i + 1} of ${numChunks}...`);
  
        // Make the OpenAI API request
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: 'You are a legal expert specializing in identifying problematic clauses in Terms of Use documents.' },
            {
              role: 'user',
              content: `You are a legal expert reviewing a Terms of Use document. 
              Please identify and summarize only the problematic or concerning sections of the following Terms of Use chunk. 
              Focus on sections that may negatively impact user rights or privacy, such as:
              - **Data Collection**: Any invasive or excessive data collection practices.
              - **Data Usage**: Any use of data that could compromise privacy or security.
              - **Data Sharing**: Sharing data with third parties that may violate user expectations.
              - **User Rights**: Clauses that limit user rights or impose unreasonable restrictions.
              - **Retention**: Terms that involve retaining user data for an unusually long time.
              - **Waiving Rights**: Any waivers of important legal rights.
  
              Ignore any benign or standard terms that are commonly acceptable. Summarize only the concerning parts in the chunk below:
              ${chunk}` 
            }
          ],
          max_tokens: maxOutputTokens,
          temperature: 0.7,
        });
  
        // Treat the completion content as plain text
        const chunkConcerns = completion.choices[0].message.content.trim();
        
        // Optional: Here you can process the chunkConcerns further if necessary to structure it
        concernsList.push({ chunk: i + 1, concerns: chunkConcerns });
      }
  
      return concernsList;  // Return the list of concerns for all chunks
  
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
