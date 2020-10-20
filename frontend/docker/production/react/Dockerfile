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
COPY docker/production/nginx/nginx.conf /nginx.conf
COPY docker/production/nginx/nginx.subdir.conf /nginx.subdir.conf

# Determines which conf to use if app is/is not being served through subdirectory
COPY ./docker/production/react/entrypoint /entrypoint
RUN sed -i 's/\r$//g' /entrypoint
RUN chmod +x /entrypoint
ENTRYPOINT ["/entrypoint"]

EXPOSE 3000

# Start server
CMD ["nginx", "-g", "daemon off;"]
