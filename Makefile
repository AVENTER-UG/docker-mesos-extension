IMAGE?=avhost/docker-mesos-extension
TAG?=0.3.4

BUILDER=default

STATIC_FLAGS=CGO_ENABLED=0
LDFLAGS="-s -w"
GO_BUILD=$(STATIC_FLAGS) go build -trimpath -ldflags=$(LDFLAGS)

INFO_COLOR = \033[0;36m
NO_COLOR   = \033[m

CHANGELOG=$(SHELL cat changelog.md)

bin: ## Build the binary for the current platform
	@echo "$(INFO_COLOR)Building...$(NO_COLOR)"
	$(GO_BUILD) -o bin/service ./vm

build: ## Build service image to be deployed as a desktop extension
	docker build --tag=$(IMAGE):$(TAG) .

install: build ## Install the extension
	docker extension install -f $(IMAGE):$(TAG) 

update: build ## Update the extension
	echo $(CHANGELOG)
	docker extension update -f $(IMAGE):$(TAG)

yarn:
	cd ui; yarn install; yarn start

set-ui:
	docker extension dev ui-source avhost/docker-mesos-extension http://localhost:3000

unset-ui:
	docker extension dev reset avhost/docker-mesos-extension

uninstall: ## Uninstall the extension
	echo $(CHANGELOG)
	docker extension uninstall $(IMAGE):$(TAG)

prepare-buildx: ## Create buildx builder for multi-arch build, if not exists
	docker buildx inspect $(BUILDER) || docker buildx create --name=$(BUILDER) --driver=docker-container --driver-opt=network=host

validate:
	docker extension validate avhost/docker-mesos-extension:${TAG}

push: prepare-buildx ## Build & Upload extension image to hub. Do not push if tag already exists: make push-extension tag=0.1
	docker buildx create --use default
	docker buildx build --push --platform=linux/amd64,linux/arm64 --build-arg TAG=$(TAG) --tag=$(IMAGE):$(TAG) .

help: ## Show this help
	@echo Please specify a build target. The choices are:
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(INFO_COLOR)%-30s$(NO_COLOR) %s\n", $$1, $$2}'

.PHONY: bin extension push-extension help

