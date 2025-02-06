FRONTEND_RULE="Host(\`$HOST_NAME\`)"
BACKEND_RULE="Host(\`$HOST_NAME\`) && (PathPrefix(\`/account-confirm-email\`) || PathPrefix(\`/accounts\`) || PathPrefix(\`/api\`) || PathPrefix(\`/complete\`) || PathPrefix(\`/frontend-config.js\`) || PathPrefix(\`/globus\`) || PathPrefix(\`/login\`) || PathPrefix(\`/proxy\`) || PathPrefix(\`/redoc\`) || PathPrefix(\`/swagger\`) || PathPrefix(\`/tempStorage\`))"

export HOST_NAME=$HOST_NAME FRONTEND_RULE=$FRONTEND_RULE \
    BACKEND_RULE=$BACKEND_RULE && envsubst <traefik.tmpl >/etc/traefik/traefik.yml
