# Interactive Talking Avatar - Technical Documentation

## System Architecture

### Overview

This application creates an interactive avatar that responds to user input with synchronized speech
and facial animations. It combines OpenAI's GPT-4 for intelligent responses, Azure Speech Services
for voice synthesis, and SVG-based viseme animations for realistic mouth movements.

## Backend Architecture (`server.js`)

### Core Services Integration

1. **OpenAI Integration**

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

- Handles conversation intelligence
- Uses GPT-4 model for natural responses
- Processes user input through chat completions API

2. **Azure Speech Services**

```javascript
const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
```

- Converts text to speech
- Generates viseme data for mouth movements
- Outputs MP3 audio format (48KHz, 192Kbps)

### API Endpoints

1. **Chat Endpoint** (`POST /api/chat`)

- Handles incoming user messages
- Flow:
  1. Sanitizes input
  2. Gets AI response from OpenAI
  3. Converts response to speech
  4. Generates viseme timing data
  5. Returns audio file and viseme information

2. **Audio Endpoint** (`GET /api/audio/:filename`)

- Serves generated audio files
- Implements automatic cleanup
- Handles streaming of MP3 data

### Security Measures

```javascript
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
});
```

- Rate limiting
- CORS protection
- Input sanitization
- Temporary file management

## Frontend Architecture

### Components

1. **Avatar Component** (`Avatar.vue`)

- Manages visual representation
- Handles:
  - Audio playback
  - Viseme overlay management
  - Animation timing
  - Mouth position synchronization

2. **Navbar Component** (`Navbar.vue`)

- User interface controls
- Theme management
- Navigation elements

### Asset Management

- 21 SVG viseme files (`frontend/src/assets/`)
- Each represents a different mouth position
- Numbered 0-20 for different phonetic positions

### Communication Flow

1. **User Input → Backend**

```javascript
// Frontend request
axios.post('http://localhost:4000/api/chat', { message });
```

2. **Backend Processing**

```javascript
// Backend response
{
  response: "AI text response",
  audio: "unique_filename.mp3",
  visemes: [
    { offset: timestamp, id: visemeId },
    // ...more viseme data
  ]
}
```

3. **Frontend Animation**

- Loads audio file
- Maps viseme timing to SVG overlays
- Synchronizes playback with animations

## Environment Configuration

### Required Environment Variables

```
OPENAI_API_KEY=your_openai_key
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=your_region
AZURE_VOICE_NAME=your_voice_selection
```

### Development Setup

1. Backend:

```bash
cd backend
npm install
npm start
```

2. Frontend:

```bash
cd frontend
npm install
npm run dev
```

3. Combined Development:

```bash
npm run dev
```

(Uses concurrently to run both services)

## Technical Dependencies

### Backend Dependencies

- express: Web server framework
- openai: GPT-4 API integration
- microsoft-cognitiveservices-speech-sdk: Azure Speech Services
- cors: Cross-origin resource sharing
- express-rate-limit: Rate limiting
- sanitize-html: Input sanitization

### Frontend Dependencies

- vue: UI framework
- axios: HTTP client
- Various SVG assets for viseme animations

## Error Handling

1. **Backend Error Management**

- API error catching
- Service availability checks
- Rate limit enforcement
- File system error handling

2. **Frontend Error Management**

- Network error handling
- Audio playback error recovery
- Animation synchronization fallbacks

## Performance Considerations

1. **Audio Processing**

- MP3 format for efficient delivery
- Streaming audio response
- Automatic file cleanup

2. **Animation Performance**

- SVG-based for scalability
- Efficient viseme switching
- Optimized timing calculations

## Future Enhancements

- WebSocket integration for real-time responses
- Caching for frequent responses
- Additional animation states
- Enhanced error recovery
- Voice selection options
