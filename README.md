# Apache Mesos Extension for Docker Desktop

The Apache Mesos extension for Docker Desktop enables developers who are working with Mesos to deploy and test their 
applications from Docker Desktop with ease.

## Building locally

See API doc here: https://github.com/docker/extensions-sdk/tree/main/docs/dev/api

- Build with `make build`
- Install extension with `make install`
- Update extension with `make update`
- Uninstall extension with `make uninstall-extension`

## UI Development

- start local web server with `cd ui; yarn start`
- make extension use local web server with `docker extension dev ui-source avhost/docker-mesos-extension http://localhost:3000`
- close and reopen Docker dashboard.
- changes to React code will be reflected in the UI on file save automatically.
- after developing, disable dev mode `docker extension dev reset avhost/docker-mesos-extension`
