# Metagrid Helm Chart

## Install
```shell
helm install <name> oci://ghcr.io/esgf2-us/metagrid --version v1.3.2
```

## Testing locally
To test locally, you'll need `minikube`, `helm`, and `helmfile`.

### Start the Kubernetes cluster.
Deploy a local Kubernetes cluster.
```shell
minikube start
minikube status
```

### Deploy Metagrid + Traefik
This will deploy Metagrid and Traefik, the service can be accessed using minikubes tunnel.
```shell
helmfile apply
```

If you're testing a PR you can test those container image using the following.
```shell
helmfile apply --set frontend.image.tag=pr-<number> --set backend.image.tag=pr-<number>
```

### Use minikube
After launching the tunnel you can open https://localhost/search

```shell
minikube tunnel
```