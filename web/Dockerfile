# Simple single-stage build for Cloud Run
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["npm", "start"]
