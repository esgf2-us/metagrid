FROM python:3.11-slim

ENV PYTHONUNBUFFERED 1

RUN apt-get update \
    # dependencies for building Python packages
    && apt-get install -y build-essential \
    # psycopg2 dependencies
    && apt-get install -y libpq-dev \
    # Translations dependencies
    && apt-get install -y gettext \
    # cleaning up unused files
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system django \
    && adduser --system --ingroup django django

# Requirements are installed here to ensure they will be cached.
COPY requirements /requirements
RUN pip3 install --upgrade pip
RUN pip3 install setuptools --upgrade
RUN pip3 install --no-cache-dir -r /requirements/local.txt

COPY . /app

RUN mkdir -p /app/staticfiles/.well-known \
    && cyclonedx-py requirements requirements/base.txt --output-format json --outfile /app/staticfiles/.well-known/bom

WORKDIR /app
USER django
EXPOSE 5000
CMD ["/usr/local/bin/gunicorn", "-c", "gunicorn_conf.py", "config.wsgi", "--chdir=/app"]
