# Pull official base image
FROM node:24-alpine AS build

# Update Alpine packages for security patches
RUN apk upgrade --no-cache

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.26.0

# Add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH
ENV GENERATE_SOURCEMAP=false

# Install app dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Add app
COPY . ./
RUN pnpm build
CMD [ "pnpm", "start" ]

# Build production environment
FROM nginxinc/nginx-unprivileged:stable AS prod
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
