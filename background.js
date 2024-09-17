import { config } from 'dotenv';
import OpenAI from 'openai';  // Updated import
import fs from 'fs/promises';  // Use fs/promises to read files asynchronously

// Load environment variables from .env
config();

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

// Function to summarize the privacy policy using OpenAI Chat Completion
async function summarizePolicy(privacyPolicyText) {
  try {
    const model = process.env.MODEL_VERSION || 'gpt-4o-mini';  // Get the model from environment
    const { contextWindow, maxOutputTokens } = TOKEN_LIMITS[model];  // Get token limits for the model

    // Calculate total tokens required
    const totalTokens = charsToTokens(privacyPolicyText.length);

    // Determine how many chunks we need based on the context window
    const maxInputTokens = contextWindow - maxOutputTokens;
    const numChunks = Math.ceil(totalTokens / maxInputTokens);

    console.log(`Model: ${model}, Total Tokens: ${totalTokens}, Chunks: ${numChunks}`);

    let summarizedContent = '';

    // Split text into chunks and make multiple API calls
    for (let i = 0; i < numChunks; i++) {
      const start = i * maxInputTokens * 4;  // Multiply by 4 to convert tokens to characters
      const end = start + maxInputTokens * 4;  // End character for the current chunk
      const chunk = privacyPolicyText.slice(start, end);

      console.log(`Summarizing chunk ${i + 1} of ${numChunks}...`);

      // Construct the targeted prompt
      const completion = await openai.chat.completions.create({
        model: model,  // Use the selected model
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes privacy policies.' },
          { 
            role: 'user', 
            content: `Please summarize the following privacy policy by focusing only on the following aspects:
            - **Data Collection**: What personal data is being collected, and how is it collected?
            - **Data Usage**: How is the collected data being used, and for what purposes?
            - **Data Sharing**: Is the data being shared with third parties, and if so, who are they?
            - **User Rights**: What rights do users have regarding their data, and how can they exercise these rights?
            - **Data Retention**: How long is the collected data retained?
            - **Waiving Rights**: Are users waiving any of their rights by accepting the policy?

            Provide the summary in bullet point format, with no more than 2-3 sentences per bullet point, highlighting only the most important and actionable information.` 
          }
        ],
        max_tokens: maxOutputTokens,  // Limit the response to model-specific output tokens
        temperature: 0.7,  // Adjust creativity level
      });

      summarizedContent += completion.choices[0].message.content.trim() + '\n';
    }

    // Print the summarized result to the console
    console.log("Summarized Privacy Policy:\n");
    console.log(summarizedContent);

  } catch (error) {
    console.error('Error with OpenAI API:', error);
  }
}

// Read the privacy policy file and summarize it
async function main() {
  try {
    // Read the policy file
    const privacyPolicyText = await fs.readFile('policies/discord_policy.txt', 'utf8');

    // Print the number of tokens
    const totalTokens = charsToTokens(privacyPolicyText.length);

    // Summarize the content
    await summarizePolicy(privacyPolicyText);
  } catch (error) {
    console.error('Error reading the policy file:', error);
  }
}

// Call the main function to execute the test
main();
