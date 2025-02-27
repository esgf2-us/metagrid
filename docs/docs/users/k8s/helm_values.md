# Metagrid settings
The `config:` section of `values.yaml` will be passed through Helm's `tpl` function and the result will be stored in a Kubernetes Secret and mounted as environment variables in the Django backend pod. See [Configurable Environment Variables](../configurable_environment_variables.md) for available environment variables.

# Configuring Postgres
This chart includes the [Bitnami Postgres-ha chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql-ha) as a dependency by default. You can customize this instance using the `postgres:` key in values.yaml.

# Using an external Postgres database
First, disable the included Postgres instance by setting `postgres.enabled: false` in values.yaml.
Then, use the [standard libpq environment variables](https://www.postgresql.org/docs/current/libpq-envars.html) in the `config:` section to point to the external Postgres instance. For example:
```yaml
postgres:
  enabled: false

config:
  PGHOST: postgres.example.local
  PGUSER: metagrid_user
  PGPASSWORD: some_password
```

# Using an external Node Status API endpoint
This chart includes a minimal Prometheus and Blackbox Exporter installation to serve the Node Status API. To use an existing or external Node Status API endpoint, disable the included instance and point `METAGRID_STATUS_URL` to your existing API endpoint:
```yaml
nodeStatusBackend:
  enabled: false

config:
  METAGRID_STATUS_URL: https://thanos-querier.openshift-monitoring.svc.cluster.local:9092/api/v1/query?query=probe_success%7Bjob%3D%22http_2xx%22%2C+target%3D~%22.%2Athredds.%2A%22%7D
```
