# Pull official base image
FROM node:slim

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install

# Add app
COPY . ./

# Start app
CMD ["yarn", "start:local"]
