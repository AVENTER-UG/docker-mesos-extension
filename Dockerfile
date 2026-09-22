FROM golang:1.24-alpine AS builder
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

FROM --platform=$BUILDPLATFORM node:24-alpine AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# install
COPY ui /ui
RUN npm run build \
    && test -f /ui/build/index.html \
    && test -d /ui/build/static \
    && test -n "$(find /ui/build/static -type f -print -quit)"

FROM alpine
LABEL org.opencontainers.image.title="Mini Cluster" \
    org.opencontainers.image.description="Mini Cluster enables you run a local ClusterD cluster." \
    org.opencontainers.image.vendor="AVENTER UG (haftungsbeschränkt)" \
    org.opencontainers.image.source="https://github.com/AVENTER-UG/docker-mesos-extension" \
    com.docker.desktop.extension.icon="https://www.clusterd.de/assets/images/clusterd-mark.png" \
    com.docker.extension.additional-urls='[{"title":"Support","url":"https://github.com/AVENTER-UG/docker-mesos-extension/issues"}]' \
    com.docker.extension.screenshots='[{"alt":"View Overview", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-overview.png"}, {"alt":"View Tasks", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-task.png"}, {"alt":"View Frameworks", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-framework.png"}, {"alt":"View Task Details", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-task-detail.png"}, {"alt":"View Framework Detail", "url":"https://raw.githubusercontent.com/AVENTER-UG/docker-mesos-extension/master/assets/ui-framework-detail.png"}]' \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.categories="container-orchestration,cloud-development" \
    com.docker.extension.detailed-description="\    
    <p>\"Mini Cluster\" enables developers who are working with ClusterD, the continued development of Apache Mesos, to deploy and test their \
      ClusterD applications with ease.</p> \
    <p> \
      <h3>What it is for:</h3> \
      These Docker Extension should help you to run, test and develop Frameworks for ClusterD. \
    </p> \
    <p> \
      <h3>What it does not: </h3> \
      It does not include any kind of frameworks (like Marathon or M3s). You are not able to run workload out of \
      the box. But there are a lot of frameworks outside, that help you to bring your software and/or containers\
      up and running under ClusterD.\
    </p> \
    <p> \
      <h3>Features:</h3> \
      <ul> \
        <li>Access to the ClusterD UI</li>\
        <li>Support Docker containers</li> \
        <li>Access to the ClusterD Master API (Port 5050)</li> \
        <li>Access to ClusterD Zookeeper (Port 2181)</li> \
        <li>Include traefik Proxy</li> \
      </ul> \
    </p> " \
    com.docker.extension.publisher-url="https://www.aventer.biz" \
    com.docker.extension.changelog=" \
    <p><strong>v1.0.0</strong></p> \
    <ul> \
      <li>Migrated the UI to the modern ClusterD WebUI.</li> \
      <li>Added a dedicated Mini Cluster Home page and ClusterD Overview dashboard.</li> \
      <li>Added Docker Desktop theme synchronization and Docker Extension styling.</li> \
      <li>Removed authentication for the local HTTP ClusterD environment.</li> \
      <li>Replaced the extension icon with the ClusterD logo.</li> \
    </ul>"

COPY --from=builder /backend/bin/service /
COPY docker-compose.yaml .
COPY metadata.json .
COPY clusterd.png .
COPY mesos.svg .
COPY --from=client-builder /ui/build ui
CMD ["/service", "-socket", "/run/guest-services/extension-docker-mesos-extension.sock"]
