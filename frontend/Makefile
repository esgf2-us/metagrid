.PHONY: build
build:
	docker build $(ARGS) -t react:latest -f docker/production/react/Dockerfile .

.PHONY: run
run:
	docker run $(ARGS) -it --rm -p 3000:3000 react:latest

.PHONY: run-shell
run-shell:
	docker run $(ARGS) -it --rm --entrypoint /bin/sh react:latest
