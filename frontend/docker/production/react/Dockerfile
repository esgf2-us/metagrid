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
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
	yarn install --frozen-lock-file --network-timeout=1000000

# Add app
COPY src ./src
COPY tsconfig.json ./
COPY public ./public
COPY .eslintrc.js ./
COPY .prettierignore ./
COPY .prettierrc ./
# required as a placeholder
COPY .envs/.react /app/.envs/.prod.env
RUN yarn build:production

# Build production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY docker/production/nginx/nginx.conf /nginx.conf
COPY docker/production/nginx/nginx.subdir.conf /nginx.subdir.conf
COPY .envs/.react /env

# Determines which conf to use if app is/is not being served through subdirectory
COPY ./docker/production/react/entrypoint /entrypoint
RUN sed -i 's/\r$//g' /entrypoint
RUN chmod +x /entrypoint
ENTRYPOINT ["/entrypoint"]

EXPOSE 3000

# Start server
CMD ["nginx", "-g", "daemon off;"]
