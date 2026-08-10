FROM node:20-alpine

WORKDIR /app

# Copy server package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy server application code
COPY . .

# Expose port
EXPOSE 3025

# Run application
CMD ["node", "index.js"]
