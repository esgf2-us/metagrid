# Metagrid Helm Chart

1. [Install](#install)
2. [Testing locally](#testing-locally)
    - [Start the Kubernetes cluster](#start-the-kubernetes-cluster)
    - [Deploy Metagrid + Traefik](#deploy-metagrid--traefik)
    - [Use minikube](#use-minikube)
3. [Helm Chart `values.yaml` Configuration](#helm-chart-valuesyaml-configuration)
    - [Top-Level Configuration](#top-level-configuration)
    - [Ingress](#ingress)
    - [Config](#config)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [PostgreSQL](#postgresql)
    - [Node Status Backend](#node-status-backend)
4. [Creating a backend admin account](#creating-a-backend-admin-account)

## Install
```shell
helm install <name> oci://ghcr.io/esgf2-us/metagrid --version v1.3.5
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

# Helm Chart `values.yaml` Configuration

This document describes the configurable values available in the `values.yaml` for the Helm chart. These values can be customized to meet your deployment needs for various components such as ingress, backend services, frontend services, PostgreSQL, and more.

## Top-Level Configuration

| Parameter         | Description                         |
|-------------------|-------------------------------------|
| `nameOverride`    | Override the name of the release.   |
| `fullnameOverride`| Override the full name of the release. |

---

## Ingress

| Parameter             | Description                                                       | Type     | Default |
|-----------------------|-------------------------------------------------------------------|----------|---------|
| `ingress.enabled`     | Enable or disable ingress resources for the application.          | `boolean`| `false` |
| `ingress.tls`         | Enable or disable TLS for ingress.                                | `boolean`| `false` |
| `ingress.host`        | Specify the hostname for ingress.                                 | `string` | N/A     |
| `ingress.className`   | Set the ingress class name if required.                           | `string` | N/A     |
| `ingress.labels`      | Custom labels for ingress resources.                              | `object` | `{}`    |
| `ingress.annotations` | Custom annotations for ingress resources.                         | `object` | `{}`    |

---

## Config

| Parameter                                 | Description                                                                                      | Type     | Default                                         |
|-------------------------------------------|--------------------------------------------------------------------------------------------------|----------|-------------------------------------------------|
| `config.PGHOST`                           | PostgreSQL host value, dynamically set using the `postgresql-ha` subchart.                        | `string` | N/A                                             |
| `config.PGUSER`                           | PostgreSQL username value, dynamically set using the `postgresql-ha` subchart.                    | `string` | N/A                                             |
| `config.PGPASSWORD`                       | PostgreSQL password value, dynamically set using the `postgresql-ha` subchart.                    | `string` | N/A                                             |
| `config.GUNICORN_WORKERS`                 | Number of Gunicorn workers for handling requests.                                                 | `string` | `'2'`                                           |
| `config.METAGRID_SEARCH_URL`              | URL for the Metagrid search service.                                                              | `string` | `https://esgf-node.ornl.gov/esg-search/search`   |
| `config.METAGRID_WGET_URL`                | URL for the Metagrid wget service.                                                                | `string` | `https://esgf-node.ornl.gov/esg-search/wget`    |
| `config.METAGRID_STATUS_URL`              | URL for checking Metagrid status, dynamically referenced.                                         | `string` | N/A                                             |
| `config.METAGRID_SOCIAL_AUTH_GLOBUS_KEY`  | Placeholder key for Globus authentication.                                                        | `string` | `"key"`                                        |
| `config.METAGRID_SOCIAL_AUTH_GLOBUS_SECRET`| Placeholder secret for Globus authentication.                                                     | `string` | `"secret"`                                     |
| `config.METAGRID_GLOBUS_CLIENT_ID`        | Client ID for Globus authentication.                                                              | `string` | `"clientID"`                                   |

---

## Frontend

| Parameter                               | Description                                                           | Type       | Default     |
|-----------------------------------------|-----------------------------------------------------------------------|------------|-------------|
| `frontend.replicaCount`                 | Number of frontend replicas.                                          | `integer`  | `1`         |
| `frontend.image.repository`             | The repository for the frontend image.                                | `string`   | `ghcr.io/esgf2-us/metagrid-frontend` |
| `frontend.image.pullPolicy`             | The pull policy for the image.                                        | `string`   | `IfNotPresent` |
| `frontend.image.tag`                    | The image tag.                                                        | `string`   | N/A         |
| `frontend.imagePullSecrets`             | Image pull secrets for accessing private repositories.                | `array`    | `[]`        |
| `frontend.serviceAccount.create`        | Whether to create a service account.                                  | `boolean`  | `true`      |
| `frontend.serviceAccount.automount`     | Whether to automount service account token.                           | `boolean`  | `false`     |
| `frontend.serviceAccount.annotations`   | Annotations for the service account.                                  | `object`   | `{}`        |
| `frontend.podAnnotations`               | Annotations for the frontend pods.                                    | `object`   | `{}`        |
| `frontend.podLabels`                    | Labels for the frontend pods.                                         | `object`   | `{}`        |
| `frontend.podSecurityContext`           | Pod security context for the frontend.                                | `object`   | `{}`        |
| `frontend.securityContext`              | Security context for the frontend pods.                               | `object`   | `{}`        |
| `frontend.service.type`                 | The type of service (e.g., `ClusterIP`).                              | `string`   | `ClusterIP` |
| `frontend.service.port`                 | The service port for frontend.                                       | `integer`  | `8080`      |
| `frontend.resources`                    | Resource requests and limits for the frontend pod.                    | `object`   | `{}`        |
| `frontend.autoscaling.enabled`           | Whether autoscaling is enabled for the frontend service.              | `boolean`  | `false`     |
| `frontend.autoscaling.minReplicas`      | Minimum number of replicas for autoscaling.                           | `integer`  | `1`         |
| `frontend.autoscaling.maxReplicas`      | Maximum number of replicas for autoscaling.                           | `integer`  | `100`       |
| `frontend.autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization percentage for autoscaling. | `integer`  | `80`        |
| `frontend.volumes`                       | Volumes to mount for the frontend.                                    | `array`    | `[]`        |
| `frontend.volumeMounts`                  | Volume mounts for the frontend.                                      | `array`    | `[]`        |
| `frontend.nodeSelector`                 | Node selectors for the frontend pods.                                 | `object`   | `{}`        |
| `frontend.tolerations`                  | Tolerations for the frontend pods.                                    | `array`    | `[]`        |
| `frontend.affinity`                     | Affinity rules for the frontend pods.                                 | `object`   | `{}`        |

---

## Backend

| Parameter                                  | Description                                                                | Type      | Default   |
|--------------------------------------------|----------------------------------------------------------------------------|-----------|-----------|
| `backend.admin.create`                     | Whether to create an admin user for the backend.                           | `boolean` | `false`   |
| `backend.migrateJob.enabled`               | Whether to enable the migration job.                                      | `boolean` | `true`    |
| `backend.migrateJob.backoffLimit`          | Maximum number of retries for the migration job.                          | `integer` | `4`       |
| `backend.projects`                         | Example configuration for defining backend projects.                       | `string`  | N/A       |
| `backend.replicaCount`                     | Number of backend replicas.                                               | `integer` | `1`       |
| `backend.image.repository`                 | The repository for the backend image.                                     | `string`  | `ghcr.io/esgf2-us/metagrid-backend` |
| `backend.image.pullPolicy`                 | The pull policy for the backend image.                                     | `string`  | `IfNotPresent` |
| `backend.image.tag`                        | The image tag for the backend image.                                       | `string`  | N/A       |
| `backend.imagePullSecrets`                 | Image pull secrets for accessing private repositories.                     | `array`   | `[]`      |
| `backend.serviceAccount.create`            | Whether to create a service account for the backend pods.                  | `boolean` | `true`    |
| `backend.serviceAccount.automount`         | Whether to automount the service account token.                           | `boolean` | `false`   |
| `backend.serviceAccount.annotations`       | Annotations for the service account.                                       | `object`  | `{}`      |
| `backend.podAnnotations`                   | Annotations for the backend pods.                                         | `object`  | `{}`      |
| `backend.podLabels`                        | Labels for the backend pods.                                              | `object`  | `{}`      |
| `backend.podSecurityContext`               | Pod security context for the backend pods.                                | `object`  | `{}`      |
| `backend.securityContext`                  | Security context for the backend pods.                                    | `object`  | `{}`      |
| `backend.service.type`                     | The type of service (e.g., `ClusterIP`).                                  | `string`  | `ClusterIP` |
| `backend.service.port`                     | The service port for the backend.                                         | `integer` | `5000`    |
| `backend.resources`                        | Resource requests and limits for the backend pod.                         | `object`  | `{}`      |
| `backend.autoscaling.enabled`               | Whether autoscaling is enabled for the backend service.                    | `boolean` | `false`   |
| `backend.autoscaling.minReplicas`          | Minimum number of replicas for autoscaling.                               | `integer` | `1`       |
| `backend.autoscaling.maxReplicas`          | Maximum number of replicas for autoscaling.                               | `integer` | `100`     |
| `backend.autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization percentage for autoscaling. | `integer` | `80`      |
| `backend.volumes`                          | Volumes to mount for the backend.                                          | `array`   | `[]`      |
| `backend.volumeMounts`                     | Volume mounts for the backend.                                            | `array`   | `[]`      |
| `backend.nodeSelector`                     | Node selectors for the backend pods.                                      | `object`  | `{}`      |
| `backend.tolerations`                      | Tolerations for the backend pods.                                         | `array`   | `[]`      |
| `backend.affinity`                         | Affinity rules for the backend pods.                                      | `object`  | `{}`      |

---

## PostgreSQL

| Parameter                                 | Description                                                                     | Type      | Default     |
|-------------------------------------------|---------------------------------------------------------------------------------|-----------|-------------|
| `postgresql.enabled`                      | Whether PostgreSQL is enabled as part of the deployment.                        | `boolean` | `true`      |
| `postgresql.nameOverride`                 | Override the name for PostgreSQL.                                               | `string`  | N/A         |
| `postgresql.backup.enabled`               | Whether backups are enabled for PostgreSQL.                                     | `boolean` | `false`     |
| `postgresql.backup.cronjob.podSecurityContext.enabled` | Whether to enable pod security context for backup cronjob.    | `boolean` | `false`     |
| `postgresql.persistence.enabled`          | Whether to enable persistent storage for PostgreSQL.                            | `boolean` | `true`      |
| `postgresql.postgresql.replicaCount`      | Number of PostgreSQL replicas.                                                  | `integer` | `1`         |
| `postgresql.postgresql.username`          | The PostgreSQL username.                                                       | `string`  | `admin`     |
| `postgresql.postgresql.password`          | The PostgreSQL password.                                                       | `string`  | `password`  |
| `postgresql.postgresql.repmgrPassword`    | The password for the PostgreSQL repmgr user.                                    | `string`  | `repmgrpassword` |
| `postgresql.pgpool.adminPassword`         | Admin password for PostgreSQL pgpool.                                           | `string`  | `pgpoolpassword` |

---

## Node Status Backend

| Parameter                                  | Description                                                       | Type      | Default     |
|--------------------------------------------|-------------------------------------------------------------------|-----------|-------------|
| `nodeStatusBackend.enabled`                | Enable the node status backend.                                   | `boolean` | `true`      |
| `nodeStatusBackend.replicaCount`           | Number of replicas for node status backend.                        | `integer` | `1`         |
| `nodeStatusBackend.podAnnotations`         | Annotations for node status backend pods.                          | `object`  | `{}`        |
| `nodeStatusBackend.podLabels`              | Labels for node status backend pods.                               | `object`  | `{}`        |
| `nodeStatusBackend.serviceAccount.create`  | Whether to create a service account for node status backend pods. | `boolean` | `true`      |
| `nodeStatusBackend.serviceAccount.automount` | Whether to automount the service account token.                  | `boolean` | `false`     |
| `nodeStatusBackend.serviceAccount.annotations` | Annotations for the service account.                             | `object`  | `{}`        |
| `nodeStatusBackend.imagePullSecrets`       | Image pull secrets for accessing private repositories.            | `array`   | `[]`        |
| `nodeStatusBackend.podSecurityContext`     | Security context for node status backend pods.                    | `object`  | `{}`        |
| `nodeStatusBackend.volumes`                | Volumes for the node status backend.                               | `array`   | `[]`        |
| `nodeStatusBackend.volumeMounts`           | Volume mounts for the node status backend.                        | `array`   | `[]`        |
| `nodeStatusBackend.nodeSelector`           | Node selectors for node status backend pods.                      | `object`  | `{}`        |
| `nodeStatusBackend.tolerations`            | Tolerations for node status backend pods.                         | `array`   | `[]`        |
| `nodeStatusBackend.affinity`               | Affinity rules for node status backend pods.                      | `object`  | `{}`        |
| `nodeStatusBackend.service.type`           | The type of service (e.g., `ClusterIP`).                           | `string`  | `ClusterIP` |
| `nodeStatusBackend.service.port`           | The service port for the node status backend.                      | `integer` | `9090`      |
| `nodeStatusBackend.autoscaling.enabled`    | Enable autoscaling for node status backend.                        | `boolean` | `false`     |
| `nodeStatusBackend.autoscaling.minReplicas`| Minimum number of replicas for autoscaling.                        | `integer` | `1`         |
| `nodeStatusBackend.autoscaling.maxReplicas`| Maximum number of replicas for autoscaling.                        | `integer` | `100`       |
| `nodeStatusBackend.autoscaling.targetCPUUtilizationPercentage` | CPU utilization percentage for autoscaling.                 | `integer` | `80`        |
| `nodeStatusBackend.prometheus.image.repository` | Repository for Prometheus image.                                | `string`  | `quay.io/prometheus/prometheus` |
| `nodeStatusBackend.prometheus.image.pullPolicy` | The pull policy for the prometheus image.                          | `string` | `IfNotPresent` |
| `nodeStatusBackend.prometheus.image.tag`    | Tag for the Prometheus image.                                     | `string`  | `latest`    |
| `nodeStatusBackend.prometheus.securityContext`                  | Security context for the prometheus pods.                                    | `object`  | `{}`      |
| `nodeStatusBackend.prometheus.volumes`                          | Volumes to mount for the prometheus.                                          | `array`   | `[]`      |
| `nodeStatusBackend.prometheus.resources`                        | Resource requests and limits for the prometheus pod.                         | `object`  | `{}`      |
| `nodeStatusBackend.blackbox.image.repository` | Repository for Blackbox Exporter image.                          | `string`  | `quay.io/prometheus/blackbox-exporter` |
| `nodeStatusBackend.blackbox.image.tag`      | Tag for the Blackbox Exporter image.                               | `string`  | `latest`    |
| `nodeStatusBackend.blackbox.image.pullPolicy` | The pull policy for the blackbox image.                          | `string` | `IfNotPresent` |
| `nodeStatusBackend.blackbox.securityContext`                  | Security context for the blackbox pods.                                    | `object`  | `{}`      |
| `nodeStatusBackend.blackbox.volumes`                          | Volumes to mount for the blackbox.                                          | `array`   | `[]`      |
| `nodeStatusBackend.blackbox.resources`                        | Resource requests and limits for the blackbox pod.                         | `object`  | `{}`      |


# Creating a backend admin account

The following will create a Django super user account.

Set the following environment variables under `config:` and enable the account creation with `backend.admin.create`.

| Environment Variable                          | Description                                                              | Example Value      |
|-----------------------------------------------|--------------------------------------------------------------------------|--------------------|
| `config.DJANGO_SUPERUSER_PASSWORD`                   | The password for the superuser account.                                  | `yourpassword`     |
| `config.DJANGO_SUPERUSER_USERNAME`                   | The username for the superuser account.                                  | `admin`            |
| `config.DJANGO_SUPERUSER_EMAIL`                      | The email address for the superuser account.                             | `admin@example.com` |
