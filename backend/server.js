import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

// Handle __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Update this to your frontend's URL
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Rate Limiting
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later.',
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Azure Speech Configuration
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
const AZURE_VOICE_NAME = process.env.AZURE_VOICE_NAME;

if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION || !AZURE_VOICE_NAME) {
  throw new Error('Azure Speech service environment variables are not defined.');
}

// Valid speaking styles for Azure Speech Service
const VALID_STYLES = [
  'cheerful', 'sad', 'angry', 'friendly', 'terrified',
  'unfriendly', 'whispering', 'hopeful', 'shouting', 'excited'
];

// System prompt for emotional response styles
const SYSTEM_PROMPT = `You are a helpful assistant that responds naturally while choosing appropriate speaking styles.
    
RESPONSE FORMAT:
Return a JSON object with:
- message: your response text
- style: speaking style to use
- reasoning: brief explanation of style choice

AVAILABLE STYLES AND USAGE:
- cheerful: For positive news, celebrations, congratulations
- sad: For empathizing with difficulties or losses
- angry: Reserved for expressing justified concerns (use rarely)
- friendly: Default style for general conversation
- terrified: For expressing shock or extreme surprise
- unfriendly: For stern warnings or serious cautions (use rarely)
- whispering: For sharing secrets or calm reassurance
- hopeful: For encouragement and positive future outlook
- shouting: For emphasis or excitement (use very rarely)
- excited: For sharing enthusiasm or great news

Choose styles based on the emotional context of the conversation.`;

/**
 * Builds SSML markup for Azure Speech Service
 * @param {string} message - The text to speak
 * @param {string} style - Speaking style (cheerful, sad, etc)
 * @returns {string} SSML markup
 */
function buildSSML(message, style) {
  return `<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="https://www.w3.org/2001/mstts"
  xml:lang="en-US">
  <voice name="${AZURE_VOICE_NAME}">
      <mstts:viseme type="redlips_front"/>
      <mstts:express-as style="${style}">
          ${message}
      </mstts:express-as>
      <mstts:viseme type="sil"/>
      <mstts:viseme type="sil"/>
  </voice>
  </speak>`;
}

// Text-to-Speech Function with Viseme Capture - SSML (Speech Synthesis Markup Language) 
const textToSpeech = async (message, style) => {
  return new Promise((resolve, reject) => {
    // Generate SSML markup with message and style from OpenAI
    // SSML controls speech synthesis and viseme generation
    const ssml = buildSSML(message, style);
    
    // Configure Azure Speech service with our settings
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    // Set high-quality audio output format
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3; // MP3 format
    // Set the voice to use (defined in .env)
    speechConfig.speechSynthesisVoiceName = AZURE_VOICE_NAME;

    // Array to store viseme events (mouth positions)
    let visemes = [];

    // Create speech synthesizer with our config
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    // Event handler for viseme (mouth position) events
    synthesizer.visemeReceived = (s, e) => {
      console.log('Viseme received:', e.visemeId, 'at offset:', e.audioOffset / 10000);
      visemes.push({
        offset: e.audioOffset / 10000, // Convert microseconds to centiseconds
        id: e.visemeId,               // ID of the mouth position
      });
    };

    // Start speech synthesis with our SSML
    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          // Success: convert audio data to buffer and return with visemes
          const audioBuffer = Buffer.from(result.audioData);
          synthesizer.close();
          resolve({ audioBuffer, visemes });
        } else {
          // Failed to synthesize speech
          synthesizer.close();
          reject(new Error('Speech synthesis failed.'));
        }
      },
      (error) => {
        // Handle any errors during synthesis
        synthesizer.close();
        reject(error);
      }
    );
  });
};

// OpenAI chat endpoint with structured response
app.post('/api/chat', chatLimiter, async (req, res) => {
  let { message } = req.body;
  console.log('Received message:', message);

  if (!message) {
    console.log('Error: No message provided');
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Get response from OpenAI
    console.log('Requesting OpenAI response...');
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      // Tell OpenAI to return a structured JSON response
      response_format: {
        type: "json_schema",
        json_schema: {
          // Name helps with error messages and documentation
          name: "avatar_response",
          // Define the exact structure we want returned
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The response text"
              },
              style: {
                type: "string",
                // Only allow styles we support
                enum: VALID_STYLES,
                description: "Speaking style based on emotional context"
              },
              reasoning: {
                type: "string",
                description: "Explanation for style choice"
              }
            },
            // All fields must be present
            required: ["message", "style", "reasoning"],
            // Don't allow extra fields
            additionalProperties: false
          },
          // Enforce strict schema compliance
          strict: true
        }
      }
    });

    // OpenAI returns the response as a JSON string in message.content
    const parsedResponse = JSON.parse(aiResponse.choices[0].message.content);
    console.log('OpenAI response:', parsedResponse);
    console.log('Using style:', parsedResponse.style);

    // Convert text to speech using Azure with visemes
    console.log('Converting to speech...');
    const { audioBuffer, visemes } = await textToSpeech(
      parsedResponse.message,
      parsedResponse.style
    );
    console.log('Speech conversion complete, visemes:', visemes.length);

    // Generate unique filename
    const uniqueFilename = `response_${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, uniqueFilename);

    // Save the audio buffer to a file
    fs.writeFileSync(filePath, audioBuffer);
    console.log('Audio file saved');

    // Send response
    res.json({
      response: parsedResponse.message,
      style: parsedResponse.style,
      reasoning: parsedResponse.reasoning,
      audio: uniqueFilename,
      visemes
    });
    console.log('Response sent successfully');

  } catch (error) {
    console.error('Error in /api/chat:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Endpoint to serve audio files based on filename
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'Audio file not found.' });
    }

    res.set({
      'Content-Type': 'audio/mpeg', // Updated for MP3
      'Content-Disposition': `attachment; filename=${filename}`,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    // Delete the file after serving
    res.on('finish', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
