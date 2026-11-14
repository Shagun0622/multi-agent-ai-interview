
FROM node:22

WORKDIR /app

# Install backend root dependencies (ioredis)
COPY package*.json ./
RUN npm install

# Install gateway dependencies
COPY gateway/package*.json ./gateway/
WORKDIR /app/gateway
RUN npm install

# Copy source code
WORKDIR /app
COPY gateway ./gateway
COPY shared ./shared

# Start gateway
WORKDIR /app/gateway
CMD ["npm", "start"]
