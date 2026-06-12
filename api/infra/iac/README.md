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

Gerar um token JWT para testes
```sh
chmod +x login-create-token.sh
./login-create-token.sh
```

Guarde o token no contexto do terminal
TOKEN=....

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

Subir a aplicação na porta 3000 em outro console
```sh
cd api
npm run start:dev
```

Validar a autorização com o token gerado anteriormente
```sh
./validate.sh $TOKEN
```

Para verificar a falha basta colocar um token inválido e rodar o script novamente para ver o erro 401