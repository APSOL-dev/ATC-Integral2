# Step 1: Build the frontend client
FROM node:20-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Step 2: Build and run the backend server serving the frontend statically
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
# Copy compiled frontend files to server's client-dist folder
COPY --from=client-builder /client/dist ./client-dist

# Set port to 80 to match Easypanel default routing
ENV PORT=80
EXPOSE 80

CMD ["node", "index.js"]
