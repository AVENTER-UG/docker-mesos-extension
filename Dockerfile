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
LABEL org.opencontainers.image.title="Mini Cluster" \
    org.opencontainers.image.description="\"Mini Cluster\" enables you run a local Apache Mesos cluster." \
    org.opencontainers.image.vendor="AVENTER UG (haftungsbeschränkt)" \
    org.opencontainers.image.source="https://github.com/AVENTER-UG/docker-mesos-extension" \
    com.docker.desktop.extension.icon="https://www.aventer.biz/assets/images/products/minicluster.svg" \
    com.docker.extension.additional-urls='[{"title":"Support","url":"https://github.com/AVENTER-UG/docker-mesos-extension/issues"}]' \
    com.docker.extension.screenshots='[{"alt":"View Tasks", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-task.png"}, {"alt":"View Frameworks", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-framework.png"}]' \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.detailed-description="\    
    <p>\"Mini Cluster\" enables developers who are working with Apache Mesos to deploy and test their \
      Apache Mesos applications with ease.</p> \
    <p> \
      <h3>What it is for:</h3> \
      These Docker Extension should help you to run, test and develop Frameworks for Apache Mesos. \
    </p> \
    <p> \
      <h3>What it does not: </h3> \
      It does not include any kind of frameworks (like Marathon or M3s). You are not able to run workload out of \
      the box. But there are a lot of frameworks outside, that help you to bring your software and/or containers\
      up and running under Apache Mesos.\
    </p> \
    <p> \
      <h3>Features:</h3> \
      <ul> \
        <li>Access to the Apache Mesos UI</li>\
        <li>Support Docker containers</li> \
        <li>Access to the Mesos Master API (Port 5050)</li> \
        <li>Access to Apache Mesos Zookeeper (Port 2181)</li> \
      </ul> \
    </p> " \
    com.docker.extension.publisher-url="https://www.aventer.biz" \
    com.docker.extension.changelog=" \
    <p> \
      <h3>v0.3.0</h3> \
      <ul> \
        <li>Change desktop extension UI</li> \
        <li>Add Home button with a small example of how to deploy workload</li> \
      </ul> \
    </p> \
    <p> \
      <h3>v0.2.0</h3> \
      <ul>\
        <li>Open port to the Apache Mesos Agent</li>\
        <li>Add simple webui functionality</li>\ 
        <li>Update mini Apache Mesos to version 1.11.0-0.2.0</li>\
        <li>Add show details of frameworks, tasks and agents</li>\
      </ul>\
    </p> \
    <p> \
      <h3>v0.1.0</h3> \
      <ul><li>First inn</li></ul> \
    </p> "

COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY mesos.svg .
COPY --from=client-builder /ui/build ui
CMD /service -socket /run/guest-services/extension-docker-mesos-extension.sock
