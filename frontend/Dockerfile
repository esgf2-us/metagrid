# Pull official base image
FROM node:24-alpine AS build

# Patch base OS packages to wipe out vulnerabilities
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Securely enable pnpm using Corepack
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

# Add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH
ENV GENERATE_SOURCEMAP=false

# Install app dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Build production environment
FROM nginxinc/nginx-unprivileged:stable-alpine-slim AS prod

# Temporarily elevate to root to patch remaining Nginx base OS packages
USER root
RUN apk update && apk upgrade --no-cache

# Revert straight back to the safe, unprivileged Nginx user account
USER 101

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Production-only entry point
CMD ["nginx", "-g", "daemon off;"]
