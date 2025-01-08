# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install any needed packages
RUN npm install

ENV MONGO_HOST "host.docker.internal"

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8888 available to the world outside this container
EXPOSE 8888

# Run the app when the container launches
CMD ["node", "index.js"]