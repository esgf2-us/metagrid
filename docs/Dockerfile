FROM python:3-slim

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

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

# # Requirements are installed here to ensure they will be cached.
COPY requirements.txt requirements.txt
# All imports needed for autodoc.
RUN pip install -r requirements.txt

WORKDIR /docs
COPY . .
RUN mkdocs build

CMD [ "mkdocs", "serve" ]