# Use the Puppeteer base image for Node.js and Chromium
FROM ghcr.io/puppeteer/puppeteer:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Temporarily switch to root to fix permissions
USER root

# Change ownership of the working directory to the Puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch back to the Puppeteer user for security
USER pptruser

# Install dependencies
RUN npm install

# Copy the rest of the application files into the container
COPY . .

# Expose the port your application will run on
EXPOSE 8888

# Run the application
CMD ["node", "index.js"]