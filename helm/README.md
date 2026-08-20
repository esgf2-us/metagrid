# Metagrid Helm Chart

1. [Install](#install)
2. [Testing locally](#testing-locally)
    - [Start the Kubernetes cluster](#start-the-kubernetes-cluster)
    - [Deploy Metagrid + Traefik](#deploy-metagrid--traefik)
    - [Use minikube](#use-minikube)
3. [Testing the chart](#testing-the-chart)
4. [Helm Chart `values.yaml` Configuration](#helm-chart-valuesyaml-configuration)
    - [Top-Level Configuration](#top-level-configuration)
    - [Ingress](#ingress)
    - [Config](#config)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [PostgreSQL](#postgresql)
    - [Node Status Backend](#node-status-backend)
5. [Creating a backend admin account](#creating-a-backend-admin-account)
6. [FAQ](#faq)
7. [Upgrading](#upgrading)
    - [v1.5.3 -> v1.5.4](#v153---v154)

## Install
```shell
helm install <name> oci://ghcr.io/esgf2-us/metagrid --version v1.6.3
```

## Testing locally
To test locally, you'll need `minikube`, `helm`, and `helmfile`.

### Start the Kubernetes cluster.
Deploy a local Kubernetes cluster using [minikube](https://minikube.sigs.k8s.io/docs/start)
```shell
minikube start
minikube status
```

### Deploy Metagrid + Traefik
This will deploy Metagrid and Traefik, the service can be accessed using minikubes tunnel.
```shell
helmfile apply -f deploy/helmfile.yaml
```


### Deploy Metagrid + Traefik w/External Database
This will deploy Metagrid and Traefik with an external postgresql database, the service can be accessed using minikubes tunnel.
```shell
helmfile apply -f deploy/helmfile.cnpg.yaml
```

### Test with PR images
If you're testing a PR you can test those container image using the following.
```shell
helmfile apply -f deploy/helmfile.yaml --set frontend.image.tag=pr-<number>,backend.image.tag=pr-<number>,frontend.image.pullPolicy=Always,backend.image.pullPolicy=Always
```

### Use minikube
After launching the tunnel you can open https://localhost/search

```shell
minikube tunnel
```

## Testing the chart
This chart has a number of tests that can be run to verify functionality.
The tests are run using the [`helm-unittest`](https://github.com/helm-unittest/helm-unittest) plugin.

### Install the plugin
To install the plugin, run the following command:
```shell
helm plugin install https://github.com/helm-unittest/helm-unittest
```

### Run the tests
To run the tests execute the following command from the project's root directory:
```shell
helm unittest helm/
```

# Helm Chart `values.yaml` Configuration

This document describes the configurable values available in the `values.yaml` for the Helm chart. These values can be customized to meet your deployment needs for various components such as ingress, backend services, frontend services, PostgreSQL, and more.

## Top-Level Configuration

| Parameter | Description | Type | Default |
|---|---|---|---|
| `nameOverride` | Override the name of the release. | `string`| `""` |
| `fullnameOverride`| Override the full name of the release. | `string`| `""` |
| `nodeStatusUrl` | External node status url, only used if `nodeStatusBackend.enabled` is false. | `string`| `""` |
| `stacUrl` | URL for the STAC API endpoint. | `string` | `""` |
| `searchUrl` | URL for the Metagrid search service. | `string` | `https://esgf-node.ornl.gov/esgf-1-5-bridge` |
| `bannerText` | Text to display as a banner. | `string` | `""` |
| `supportInfo` | Text to display site administrator support information. | `string` | `""` |
| `footerText` | Text to display in the footer. | `string` | `""` |
| `googleAnalyticsTrackingId` | Google Analytics tracking ID. | `string` | `""` |
| `globusNodes` | List of Globus nodes to display. | `array` | `["esgf-node.ornl.gov", "eagle.alcf.anl.gov", "esgf-data.nersc.gov"]` |

---

## Ingress

| Parameter | Description | Type | Default |
|---|---|---|---|
| `ingress.enabled` | Enable or disable ingress resources for the application. | `boolean`| `false` |
| `ingress.pathType` | Path type for ingress (e.g., `Prefix`). | `string` | `"Prefix"` |
| `ingress.tls.enabled` | Enable or disable TLS for ingress. | `boolean`| `false` |
| `ingress.tls.secretName` | Secret name for TLS certificate. | `string` | `""` |
| `ingress.hosts` | Specify the hostname(s) for ingress. | `array` | `[]` |
| `ingress.className` | Set the ingress class name if required. | `string` | `""` |
| `ingress.labels` | Custom labels for ingress resources. | `object` | `{}` |
| `ingress.annotations` | Custom annotations for ingress resources. | `object` | `{}` |

---

## Wget

| Parameter | Description | Type | Default |
|---|---|---|---|
| `wget.url` | External wget url. If empty, the internal wget feature is used. | `string` | `""` |
| `wget.uploadMaxFields` | Maximum number of form fields allowed in a single upload. | `integer` | `1024` |
| `wget.globusPublicIndex` | The Globus index ID for the public ESGF2 data. | `string` | `a8ef4320-9e5a-4793-837b-c45161ca1845` |
| `wget.globusClientID` | Globus client ID for authentication. | `string` | `""` |
| `wget.globusClientSecret` | Globus client secret for authentication. | `string` | `""` |
| `wget.limit.default` | Default limit on the number of files allowed in a generated wget script. | `integer` | `9999` |
| `wget.limit.max` | Maximum number of files allowed in a generated wget script. | `integer` | `100000` |
| `wget.maxDirLength` | Maximum character length for facet values when creating directory names for wget downloads. | `integer` | `50` |

---

## Authentication

| Parameter | Description | Type | Default |
|---|---|---|---|
| `auth.enabled` | Enable authentication features. | `boolean` | `true` |
| `auth.type` | Authentication type. Options are `globus` or `keycloak`. | `string` | `globus` |
| `auth.globus.key` | Globus application key. | `string` | `""` |
| `auth.globus.secret` | Globus application secret. | `string` | `""` |
| `auth.keycloak.url` | Keycloak server URL. | `string` | `""` |
| `auth.keycloak.realm` | Keycloak realm. | `string` | `""` |
| `auth.keycloak.clientId` | Keycloak client ID. | `string` | `""` |

---

## Hotjar Integration

| Parameter | Description | Type | Default |
|---|---|---|---|
| `hotjar.id` | Hotjar site ID. | `string` | `""` |
| `hotjar.sv` | Hotjar snippet version. | `string` | `""` |

---

## Django (Backend)

| Parameter | Description | Type | Default |
|---|---|---|---|
| `django.gunicornWorkers` | Number of Gunicorn workers for handling requests. | `string` | `'2'` |
| `django.secretKey` | Django secret key. | `string` | `""` |
| `django.adminUrl` | URL for the Django admin interface. | `string` | `""` |
| `django.admins` | A list of admins. | `string` | `""` |
| `django.createSuperUser` | Whether to create an admin user for the backend. | `boolean` | `false` |
| `django.databaseUri` | Optional database URI for self-managed database, e.g. `postgresql://<user>:<password>@<host>:<port>/<dbname>`. See [django-environ docs](https://django-environ.readthedocs.io/en/latest/types.html#term-PostgreSQL). | `string` | `""` |
| `django.migrateJob.enabled` | Whether to enable the database migration job. | `boolean` | `true` |
| `django.migrateJob.backoffLimit` | Maximum number of retries for the migration job. | `integer` | `4` |
| `django.projects` | Configuration for defining backend projects. | `string` | `""` |

Gunicorn auto-reload is disabled by default for production deployments. If you need it for development-style workflows, set `django.config.GUNICORN_RELOAD: "true"` in your Helm values.

---
## Frontend

| Parameter                               | Description                                                           | Type       | Default     |
|-----------------------------------------|-----------------------------------------------------------------------|------------|-------------|
| `frontend.replicaCount`                 | Number of frontend replicas.                                          | `integer`  | `1`         |
| `frontend.image.repository`             | The repository for the frontend image.                                | `string`   | `ghcr.io/esgf2-us/metagrid-frontend` |
| `frontend.image.pullPolicy`             | The pull policy for the image.                                        | `string`   | `IfNotPresent` |
| `frontend.image.tag`                    | The image tag. Defaults to chart appVersion.                          | `string`   | `""`         |
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
| `backend.replicaCount`                     | Number of backend replicas.                                               | `integer` | `1`       |
| `backend.image.repository`                 | The repository for the backend image.                                     | `string`  | `ghcr.io/esgf2-us/metagrid-backend` |
| `backend.image.pullPolicy`                 | The pull policy for the backend image.                                     | `string`  | `IfNotPresent` |
| `backend.image.tag`                        | The image tag for the backend image. Defaults to chart appVersion.         | `string`  | `""`      |
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
| `postgresql.username`                     | PostgreSQL database username.                                                   | `string` | `postgres` |
| `postgresql.password`                     | PostgreSQL database password.                                                 | `string` | `postgres` |
| `postgresql.database`                     | PostgreSQL database name.                                                     | `string` | `postgres` |
| `postgresql.imagePullSecrets`             | Image pull secrets for accessing private repositories.            | `array`   | `[]`        |
| `postgresql.image.repository`             | Image repository.             | `string` | `postgres` |
| `postgresql.image.pullPolicy`             | Image pull policy.            | `string` | `IfNotPresent` |
| `postgresql.image.tag`                    | Image tag.                    | `string` | `16.10-bookworm` |
| `postgresql.serviceAccount.create`        | Create a service account.     | `boolean` | `true` |
| `postgresql.service.port`                 | Service port.                 | `integer` | `5432` |
| `postgresql.persistence.enabled`          | Enable PostgreSQL persistence. | `boolean` | `true` |
| `postgresql.persistence.accessMode`       | Access mode for PVC.  | `string` | `ReadWriteOnce` |
| `postgresql.persistence.size`             | Size of the PostgreSQL PVC. | `string` | `8Gi` |
| `postgresql.persistence.storageClassName` | Name of the PVC storage class. | `string` | `""` |
| `postgresql.volumes`                      | List of additional volumes. | `array` | `[]` |
| `postgresql.volumeMounts`                 | List of additional volume mounts. | `array` | `[]` |
| `postgresql.nodeSelector`                 | List of node selectors. | `array` | `[]` |
| `postgresql.tolerations`                  | List of tolerations.  | `array` | `[]` |
| `postgresql.affinity`                     | List of affinitys.    | `array` | `[]` |

---

## Node Status Backend

| Parameter                                  | Description                                                       | Type      | Default     |
|--------------------------------------------|-------------------------------------------------------------------|-----------|-------------|
| `nodeStatusBackend.enabled`                | Enable the node status backend.                                   | `boolean` | `false`      |
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

# FAQ

#### Globus login fails with `Mismatching redirect URI` error.

> Ensure your Globus auth configuration has the correct redirects.
> - `https://<host>/cart/items`
> - `https://<host>/complete/globus/`.
>
> **Ensure you have the correct paths, including the trailing slash.**
>
> If Metagrid is behind a reverse proxy you may need to set `config.DJANGO_SOCIAL_AUTH_REDIRECT_IS_HTTPS: 'true'` in your Helm chart configuration.

#### Globus login or transfers are not working.

> Ensure you have created the Globus auth application using the `Advanced Registration` type. Check that your redirects are correct as seen above.

# Upgrading

##  v1.5.3 -> v1.5.4
When upgrading to `v1.5.4` from `v1.5.3` there may be a `collation mismatch` error from PostgreSQL. This issue may be remediated by running two SQL commands.

```bash
ALTER DATABASE <db_name> REFRESH COLLATION VERSION;
REINDEX DATABASE <db_name>
```

If using the default PostgreSQL database, the following can be used.

```bash
BACKEND_POD=`kubectl get pod --selector app.kubernetes.io/name=metagrid,app.kubernetes.io/component=backend -oname`
DB_POD=`kubectl get pod --selector app.kubernetes.io/name=metagrid,app.kubernetes.io/component=database -oname`
SECRET=`kubectl  get secret --selector app.kubernetes.io/name=metagrid,app.kubernetes.io/component=database -oname`
DB_NAME=`kubectl get $SECRET -ojsonpath="{.data.POSTGRES_DB}" | base64 -d`
DB_USER=`kubectl get $SECRET -ojsonpath="{.data.POSTGRES_USER}" | base64 -d`
DB_PASS=`kubectl get $SECRET -ojsonpath="{.data.POSTGRES_PASSWORD}" | base64 -d`

kubectl exec -it $DB_POD -- psql -h localhost -U $DB_USER -d $DB_NAME -c "ALTER DATABASE $DB_NAME REFRESH COLLATION VERSION;"
kubectl exec -it $DB_POD -- psql -h localhost -U $DB_USER -d $DB_NAME -c "REINDEX DATABASE $DB_NAME;"
# restart backend pod
kubectl delete $BACKEND_POD
```
