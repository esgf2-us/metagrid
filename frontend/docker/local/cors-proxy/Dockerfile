# Pull official base image
FROM node:fermium-alpine3.15

# Set working directory
WORKDIR /cors-proxy

ENV PATH /cors-proxy/node_modules/.bin:$PATH

# Install cors-proxy dependencies
COPY cors-proxy/package.json ./
COPY cors-proxy/yarn.lock ./
RUN yarn install

# Add cors-proxy
COPY . ./

# Start cors-proxy
CMD ["node", "index.js"]
