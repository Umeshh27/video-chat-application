FROM node:20-alpine

# Install curl for the docker-compose healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the Next.js app and the custom server
RUN npm run build

EXPOSE 3000

# Start the custom server
CMD ["npm", "run", "start:server"]
