#!/usr/bin/env bash

if [[ "${1}" == "apply" ]]; then
    kubectl apply -f ./cnpg.yaml

    function wait() {
        # wait until database is deployed then continue
        while [[ ! `kubectl  wait --for=condition=Ready cluster/metagrid-cluster` ]]; do
            sleep 2
        done
    }
    export -f wait

    timeout -s SIGKILL 120s bash -c "wait"
elif [[ "${1}" == "delete" ]]; then
    kubectl delete -f ./cnpg.yaml || exit 0
fi
