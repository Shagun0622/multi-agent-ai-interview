
FROM node:22

WORKDIR /app

# Copy gateway dependencies
COPY gateway/package*.json ./gateway/

# Install dependencies inside gateway
WORKDIR /app/gateway
RUN npm install

# Copy application code and shared folder
WORKDIR /app
COPY gateway ./gateway
COPY shared ./shared

# Start gateway
WORKDIR /app/gateway

CMD ["npm", "start"]
