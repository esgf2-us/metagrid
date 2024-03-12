.PHONY: build
build:
	docker build $(ARGS) -t react:latest -f docker/production/react/Dockerfile .

.PHONY: build-local
build-local:
	docker build $(ARGS) -t react:latest -f docker/local/Dockerfile .

.PHONY: run
run:
	docker run $(ARGS) -it --rm -p 3000:3000 react:latest

.PHONY: shell
shell:
	docker run $(ARGS) -it --rm -p 3000:3000 --entrypoint /bin/sh react:latest
