import { config } from 'dotenv';
import OpenAI from 'openai';  // Updated import
import fs from 'fs/promises';  // Use fs/promises to read files asynchronously

// Load environment variables from .env
config();

// Set up OpenAI API configuration with the API key from the .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Loaded from the .env file
});

// Function to summarize the privacy policy using OpenAI Chat Completion
async function summarizePolicy(privacyPolicyText) {
  try {
    // Call OpenAI API to summarize the privacy policy using chat completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',  // Using gpt-3.5-turbo-16k to handle longer text
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes privacy policies.' },
        { role: 'user', content: `Please summarize the following privacy policy in a concise and easy-to-understand manner for users:\n\n"${privacyPolicyText}"\n\nHighlight key points about data collection, user rights, and security.` }
      ],
      max_tokens: 500,  // Limit the response to 500 tokens
      temperature: 0.7,  // Adjust creativity level
    });

    const summary = completion.choices[0].message.content.trim();

    // Print the summarized result to the console
    console.log("Summarized Privacy Policy:\n");
    console.log(summary);
  } catch (error) {
    console.error('Error with OpenAI API:', error);
  }
}

// Read the privacy policy file and summarize it
async function main() {
  try {
    // Read the policy file
    const privacyPolicyText = await fs.readFile('policies/netflix_policy.txt', 'utf8');

    // Summarize the content
    await summarizePolicy(privacyPolicyText);
  } catch (error) {
    console.error('Error reading the policy file:', error);
  }
}

// Call the main function to execute the test
main();
