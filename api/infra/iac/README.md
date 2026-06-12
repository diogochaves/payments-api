# Setup

```sh
docker network create spire

cd kong-custom 
docker build -t kong-oidcify .

cd ..
docker compose up -d
# docker-compose up -d # mac

```

Após subir

## Configurar o Keycloak
http://keycloak:8080/


### Criar Realm para nosso projeto

```sh
cd keycloak
terraform init
terraform apply -auto-approve
```

Criar um user para testes
```sh
cd scripts
chmod +x create-user.sh 
./create-user.sh 
```

Testar o login
```sh
chmod +x login-create-token.sh
./login-create-token.sh
```


## Configurar o Kong
http://localhost:8002/

Instalar o decK https://developer.konghq.com/deck/

Criar um primeiro serviço no Kong com um Swagger no yaml do Kong
```sh
cd ../../kong/scripts 
deck sync --state ./kong.yaml
```

Habilitar o plugin
```sh
chmod +x enable-oidc.sh
./enable-oidc.sh
```