# QUIRK AI Kiosk - Frontend React Application
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for better caching
COPY package.json ./
RUN npm install

# Copy application code
COPY . .

# Build arguments for environment
ARG REACT_APP_API_URL=http://localhost:8000/api/v1
ARG REACT_APP_KIOSK_ID=KIOSK-001
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_KIOSK_ID=$REACT_APP_KIOSK_ID

# Expose port
EXPOSE 3000

# Start development server (for development)
# For production, use: npm run build && serve -s build -l 3000
CMD ["npm", "start"]
