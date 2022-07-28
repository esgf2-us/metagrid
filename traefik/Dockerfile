FROM traefik:2.8

RUN apk add gettext
RUN mkdir -p /etc/traefik/acme
RUN touch /etc/traefik/acme/acme.json
RUN chmod 600 /etc/traefik/acme/acme.json

# Prepare built-time variables for template
ARG domain_name
ARG frontend_prefix
ARG backend_prefix
ENV HOST_NAME=$host_name
ENV FRONTEND_PREFIX=$frontend_prefix
ENV BACKEND_PREFIX=$backend_prefix

COPY traefik.tmpl /traefik.tmpl
RUN export HOST_NAME=$HOST_NAME, FRONTEND_PREFIX=$FRONTEND_PREFIX, \
    BACKEND_PREFIX=$BACKEND_PREFIX && envsubst < traefik.tmpl > /etc/traefik/traefik.yml
RUN rm traefik.tmpl
