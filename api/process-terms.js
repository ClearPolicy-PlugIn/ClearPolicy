// api/process-terms.js

import OpenAI from "openai";
import microCors from 'micro-cors';

const cors = microCors({
  allowMethods: ['POST', 'OPTIONS'],
  origin: '*', // Or specify your extension's origin
  allowedHeaders: ['Content-Type'],
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in environment variables.");
}

// Token limits for each model
const TOKEN_LIMITS = {
  "gpt-4o-mini": { contextWindow: 128000, maxOutputTokens: 16384 }, // GPT-4o-mini
};

// Function to process a single chunk of text using OpenAI's function calling
async function processChunk(chunkText) {
  try {
    console.log(`Processing chunk...`);

    const model = "gpt-4o-mini"; // Use gpt-4o-mini as per your request
    const { maxOutputTokens } = TOKEN_LIMITS[model];

    // Prepare the messages
    const messages = [
      {
        role: "system",
        content:
          "You are a legal expert specializing in identifying problematic clauses in Terms of Use documents.",
      },
      {
        role: "user",
        content: `As a legal expert reviewing a Terms of Use document, your goal is to identify the single most important problematic clause in the provided text that could deter users from signing up for the service. Focus on concerns that significantly impact user rights or privacy, impose unreasonable restrictions, or involve monetary values or Liability. Choose the concern that would be most helpful for a user to make an informed decision. Liability with money amount are important.

Please extract the most significant concern, only one concern from the following Terms of Use:


${chunkText}`,
      },
    ];

    // Define the function schema
    const functions = [
      {
        name: "extract_concerns",
        description: "Extracts concerns from the Terms of Use.",
        parameters: {
          type: "object",
          properties: {
            concerns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section: { type: "string", description: "The section name or number, if available." },
                  quote: { type: "string", description: "The exact quote from the Terms that is concerning." },
                  concern: { type: "string", description: "A brief explanation of why it might deter users from signing up." }
                },
                required: ["section", "quote", "concern"]
              }
            }
          },
          required: ["concerns"]
        }
      }
    ];

    console.log("Sending request to OpenAI API...");
    // Make the OpenAI API request with function calling
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      functions: functions,
      function_call: { name: "extract_concerns" }, // Force the model to call the function
      max_tokens: maxOutputTokens,
      temperature: 0.0, // Set temperature to 0 for deterministic output
    });

    // Handle the response
    const responseMessage = completion.choices[0].message;

    if (responseMessage.function_call) {
      const functionArgs = responseMessage.function_call.arguments;

      // Parse the function arguments
      try {
        const args = JSON.parse(functionArgs);
        const concerns = args.concerns || [];
        return concerns;
      } catch (parseError) {
        console.error("Error parsing function arguments:", parseError);
        console.error("Function arguments:", functionArgs);
        // Attempt to fix the JSON
        const fixedArgs = fixJSON(functionArgs);
        if (fixedArgs && fixedArgs.concerns) {
          console.log("Fixed JSON successfully.");
          return fixedArgs.concerns;
        } else {
          console.error("Failed to parse and fix function arguments.");
          throw new Error("Failed to parse function arguments.");
        }
      }
    } else {
      console.error("No function call in OpenAI response.");
      throw new Error("No function call in OpenAI response.");
    }
  } catch (error) {
    console.error(
      "Error during processChunk:",
      error.response?.data || error.message || error
    );
    throw error;
  }
}

// Function to attempt to fix malformed JSON
function fixJSON(jsonString) {
  try {
    // Remove any trailing characters after the JSON object
    const jsonObjectString = jsonString.match(/\{.*\}/s)[0];

    // Replace smart quotes with regular quotes
    let sanitizedString = jsonObjectString
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    // Replace single quotes with double quotes
    sanitizedString = sanitizedString.replace(/'/g, '"');

    // Remove any invalid control characters
    const cleanedString = sanitizedString.replace(/[\u0000-\u001F]+/g, "");

    // Remove extra commas
    const noExtraCommas = cleanedString.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    // Attempt to parse the cleaned JSON string
    const parsedJSON = JSON.parse(noExtraCommas);
    return parsedJSON;
  } catch (error) {
    console.error("Failed to fix JSON:", error);
    return null;
  }
}

export default cors(async function handler(req, res) {
  console.log('Handler started');

  if (req.method === "OPTIONS") {
    console.log('OPTIONS request');
    // Handle preflight requests
    return res.status(200).end();
  }

  try {
    console.log('Processing request');
    if (req.method !== "POST") {
      console.error('Method not allowed');
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { chunkContent } = req.body;

    if (!chunkContent || chunkContent.trim() === "") {
      console.error("No chunk content provided");
      return res
        .status(400)
        .json({ error: "No chunk content provided" });
    }

    console.log("Received chunk content.");

    const concerns = await processChunk(chunkContent);

    console.log('Sending response with concerns');
    res.status(200).json({ concerns });
  } catch (error) {
    console.error("Error processing chunk:", error);
    console.log('Sending error response');
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});
