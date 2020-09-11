# Pull official base image
FROM node:13.14.0-alpine

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn add cors-anywhere

# Add app
COPY . ./
COPY proxy.js ./

# Start app
CMD ["node", "proxy.js"]