# Setup

```sh
docker network create spire

cd kong-custom 
docker build -t kong-oidcify .

cd ..
docker compose up -d
# docker-compose up -d # mac


```