# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app files to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD [ "node", "bin/www" ]