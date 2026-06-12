# Kong customizado

Imagem customizada do Kong já com os plugins necessários.

```sh
#docker build -t kong-custom:3.8 .
docker build -t kong-auth .
```

Rodar sem cache

```sh
docker build --pull --no-cache -t kong-auth .
```