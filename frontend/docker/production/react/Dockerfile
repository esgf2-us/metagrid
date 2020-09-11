# Pull official base image
FROM node:13.14.0-alpine as build

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lock-file

# Add app
COPY . ./
RUN yarn build:production

# Build production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY docker/production/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start server
CMD ["nginx", "-g", "daemon off;"]