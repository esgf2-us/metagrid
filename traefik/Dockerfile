FROM traefik:2.8

RUN apk add gettext
RUN mkdir -p /etc/traefik/acme
RUN touch /etc/traefik/acme/acme.json
RUN chmod 600 /etc/traefik/acme/acme.json

# Prepare built-time variables for template
ARG host_name
ARG frontend_prefix
ARG backend_prefix

ENV HOST_NAME=$host_name
ENV FRONTEND_PREFIX=$frontend_prefix
ENV BACKEND_PREFIX=$backend_prefix

# Convert template to traefik.yml
COPY traefik.tmpl /traefik.tmpl
COPY make_traefik.sh /make_traefik.sh
RUN chmod +x /make_traefik.sh
RUN ./make_traefik.sh
RUN rm traefik.tmpl
RUN rm make_traefik.sh
