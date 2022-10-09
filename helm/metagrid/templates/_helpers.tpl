{{/*
Expand the name of the chart.
*/}}
{{- define "metagrid.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "metagrid.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "metagrid.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "metagrid.labels" -}}
helm.sh/chart: {{ include "metagrid.chart" . }}
{{ include "metagrid.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "metagrid.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metagrid.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Postgres host
*/}}
{{- define "metagrid.pg_host" -}}
{{ include "postgresql-ha.pgpool" .Subcharts.postgresql }}
{{- end }}

{{/*
Postgres port
*/}}
{{- define "metagrid.pg_port" -}}
{{ .Subcharts.postgresql.Values.service.ports.postgresql }}
{{- end }}

{{/*
Postgres db
*/}}
{{- define "metagrid.pg_db" -}}
{{ include "postgresql-ha.postgresqlDatabase" .Subcharts.postgresql }}
{{- end }}

{{/*
Postgres user
*/}}
{{- define "metagrid.pg_user" -}}
{{ include "postgresql-ha.postgresqlUsername" .Subcharts.postgresql }}
{{- end }}

{{/*
Postgres pass
*/}}
{{- define "metagrid.pg_pass" -}}
{{ include "postgresql-ha.postgresqlPassword" .Subcharts.postgresql }}
{{- end }}

{{/*
Postgres URI
*/}}
{{- define "metagrid.pg_uri" -}}
postgres://{{ include "metagrid.pg_user" $ }}:{{ include "metagrid.pg_pass" $ }}@{{ include "metagrid.pg_host" $ }}:{{ include "metagrid.pg_port" $ }}/{{ include "metagrid.pg_db" $ }}
{{- end }}

{{/*
Keycloak URL
*/}}
{{- define "metagrid.keycloak_url" -}}
{{ include "common.names.fullname" .Subcharts.keycloak }}.{{ .Release.Namespace }}.svc.{{ .Subcharts.keycloak.Values.clusterDomain }}:{{ coalesce .Subcharts.keycloak.Values.service.ports.http .Subcharts.keycloak.Values.service.port }}
{{- end }}

{{/*
Django ALLOWED_HOSTS
*/}}
{{- define "metagrid.django_allowed_hosts" -}}
{{- $hosts := list "$(THIS_POD_IP)" "localhost" (printf "%s-django" (include "metagrid.fullname" .)) -}}
{{- range .Values.django.ingress.hosts -}}
  {{- $hosts = append $hosts .host -}}
{{- end -}}
{{- range .Values.react.ingress.hosts -}}
  {{- $hosts = append $hosts .host -}}
{{- end -}}
{{- range (split "," .Values.django.env.DJANGO_ALLOWED_HOSTS) -}}
  {{- $hosts = append $hosts . -}}
{{- end -}}
{{- join "," $hosts -}}
{{- end }}