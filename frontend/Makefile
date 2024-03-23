TAG ?= v1.1.0-beta
IMAGE ?= ghcr.io/esgf2-us/metagrid-frontend:$(TAG)

.PHONY: build
build:
	docker build $(ARGS) -t $(IMAGE) -f docker/production/react/Dockerfile .

.PHONY: build-local
build-local:
	docker build $(ARGS) -t $(IMAGE) -f docker/local/Dockerfile .

.PHONY: run
run: ARGS ?= -e RELEASE=production
run:
	docker run $(ARGS) -it --rm -p 3000:3000 $(IMAGE)

.PHONY: shell
run: ARGS ?= -e RELEASE=production
shell:
	docker run $(ARGS) -it --rm -p 3000:3000 --entrypoint /bin/sh $(IMAGE)
