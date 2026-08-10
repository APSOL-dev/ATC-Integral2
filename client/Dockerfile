# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy client source code
COPY . .

# Pass VITE_API_URL env variable during build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build application
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files to Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
