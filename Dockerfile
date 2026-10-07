# Use an official lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy dependency manifests and install packages
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Expose the application port (Cloud Run defaults to 8080)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]