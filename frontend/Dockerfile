# Pull official base image
FROM node:23.1.0-slim AS build

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH
ENV GENERATE_SOURCEMAP=false

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lock-file --network-timeout=1000000

# Add app
COPY . ./
RUN yarn build
CMD [ "yarn", "start" ]

# Build production environment
FROM nginxinc/nginx-unprivileged:stable AS prod
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
