# Pull official base image
FROM node:13.14.0-alpine

# Set working directory
WORKDIR /proxy

# Add `/proxy/node_modules/.bin` to $PATH
ENV PATH /proxy/node_modules/.bin:$PATH

# Install proxy dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn add dotenv@^8.2.0
RUN yarn add cors-anywhere

# Add proxy
COPY src/env.ts ./
COPY proxy.js ./

EXPOSE 3001

# Start proxy
CMD ["node", "proxy.js"]