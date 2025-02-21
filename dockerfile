# Use an official Node.js runtime as a parent image
FROM timbru31/node-chrome:18

RUN apt-get update
RUN apt-get install chromium -y

ENV HOME=/home/app-user
RUN useradd -m -d $HOME -s /bin/bash app-user 
RUN mkdir -p $HOME/app
WORKDIR $HOME/app

COPY package*.json ./
COPY index.js ./
RUN chown -R app-user:app-user $HOME

USER app-user


ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8888 available to the world outside this container
EXPOSE 8888

# Run the app when the container launches
CMD ["node", "index.js"]