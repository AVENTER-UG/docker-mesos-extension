FROM golang:1.17-alpine AS builder
ENV CGO_ENABLED=0
RUN apk add --update make
WORKDIR /backend
COPY go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    make bin

FROM --platform=$BUILDPLATFORM node:17.7-alpine3.14 AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build

FROM alpine
LABEL org.opencontainers.image.title="Docker Extension for Apache Mesos" \
    org.opencontainers.image.description="This Docker Extension enables you run a local Apache Mesos cluster." \
    org.opencontainers.image.vendor="AVENTER UG (haftungsbeschränkt)" \
    org.opencontainers.image.source="https://github.com/AVENTER-UG/docker-mesos-extension" \
    com.docker.desktop.extension.icon="https://assets.d2iq.com/production/uploads/posts/apache-mesos-survey-2016.png" \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.screenshots="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="https://www.aventer.biz" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.changelog="https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/changelog.md" 

COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY mesos.svg .
COPY --from=client-builder /ui/build ui
CMD /service -socket /run/guest-services/extension-docker-mesos-extension.sock
