# Pull official base image
# node:slim build sha from 9/5/24
FROM node@sha256:377674fd5bb6fc2a5a1ec4e0462c4bfd4cee1c51f705bbf4bda0ec2c9a73af72 as build

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

# Determines which conf to use if app is/is not being served through subdirectory
COPY ./docker/production/react/entrypoint /entrypoint
# gettext-base is required for envsubst
RUN sed -i 's/\r$//g' /entrypoint && \
  chmod +x /entrypoint && \
  apt-get update && \
  apt-get install -y gettext-base && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/entrypoint"]

# Start app
CMD ["yarn", "start:local"]
