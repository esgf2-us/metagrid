#!/bin/bash

while IFS="=" read KEY VALUE; do
    is_blank_or_comment='^[[:space:]]*?(#|$)'
    [[ $KEY =~ $is_blank_or_comment ]] && continue
    if [[ ! -z "${!KEY}" ]]; then
        echo "Overriding ${KEY} with ${!KEY} from environment"
        VALUE=${!KEY}
    fi
    printf "window.%s=\"%s\";\n" ${KEY} ${VALUE} >> /usr/share/nginx/html/config/env.js
done < /docker-entrypoint.d/.prod.env
