TAG ?= latest
IMAGE ?= ghcr.io/esgf2-us/metagrid-frontend:$(TAG)

.PHONY: build
build:
	docker build $(ARGS) -t $(IMAGE) --target build .

.PHONY: build-prod
build-prod:
	docker build $(ARGS) -t $(IMAGE) --target prod .

.PHONY: run-%
run-%:
	docker run $(ARGS) -it --rm -p 8080:8080 -e RELEASE=$* $(IMAGE)

.PHONY: shell-%
shell-*:
	docker run $(ARGS) -it --rm -p 8080:8080 -e RELEASE=$* --entrypoint /bin/sh $(IMAGE)
