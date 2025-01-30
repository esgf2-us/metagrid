if [[ $BACKEND_PREFIX ]];
then
BACKEND_RULE="Host(\`$HOST_NAME\`) && PathPrefix(\`/$BACKEND_PREFIX\`)"
else
BACKEND_RULE="Host(\`$HOST_NAME\`)"
fi

if [[ $FRONTEND_PREFIX ]];
then
FRONTEND_RULE="Host(\`$HOST_NAME\`) && PathPrefix(\`/$FRONTEND_PREFIX\`)"
else
FRONTEND_RULE="Host(\`$HOST_NAME\`)"
fi

export HOST_NAME=$HOST_NAME FRONTEND_RULE=$FRONTEND_RULE \
    BACKEND_RULE=$BACKEND_RULE && envsubst < traefik.tmpl > traefik.yml
