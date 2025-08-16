FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create knowledge database and populate it
RUN node populateKnowledge.cjs

# Expose port (Hugging Face uses 7860)
EXPOSE 7860

# Start the application
CMD ["npm", "start"]