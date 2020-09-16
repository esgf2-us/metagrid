# Pull official base image
FROM node:13.14.0-alpine

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install proxy dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn add dotenv@^8.2.0
RUN yarn add cors-anywhere

# Add proxy
COPY . ./
COPY proxy.js ./

# Start proxy
CMD ["node", "proxy.js"]