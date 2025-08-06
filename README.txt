Farmer Agriculture AI Advisor API
=================================

This project is a Node.js Express API designed to help farmers in India by answering their queries using AI (dummy responses for now).

## How to Run

1. Make sure you have Node.js installed.
2. Install dependencies:
   npm install
3. Start the server:
   node index.js

The server will run on http://localhost:3000

## API Usage

- **Endpoint:** POST /ask
- **Content-Type:** application/json
- **Body:**
  {
    "question": "Your question here"
  }
- **Response:**
  {
    "answer": "This is a dummy response. Your question was: ..."
  }

## Example curl command

curl -X POST http://localhost:3000/ask -H "Content-Type: application/json" -d '{"question": "What is the best time to irrigate my crops?"}'