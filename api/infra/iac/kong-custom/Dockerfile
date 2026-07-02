# ---------- STAGE 1: Build do oidcify ----------
FROM golang:1.23 AS builder

WORKDIR /build

# Habilita toolchains remotos
ENV GOTOOLCHAIN=auto

# Instala o toolchain go1.25.5
RUN go install golang.org/dl/go1.25.5@latest && \
    /go/bin/go1.25.5 download

# Clona o oidcify
RUN git clone https://github.com/hanlaur/oidcify.git .

# Usa o toolchain go1.25.5 para rodar go mod tidy
RUN /go/bin/go1.25.5 mod tidy

# Compila o plugin Go
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 /go/bin/go1.25.5 build -o oidcify .

# ---------- STAGE 2: Kong com plugins ----------
FROM kong:3.8

USER root

# Instalar dependências para Git + LuaRocks + C toolchain — Kong usa Debian
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        build-essential \
        luarocks \
        unzip \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Copiar o plugin Go (oidcify)
COPY --from=builder /build/oidcify /usr/local/bin/oidcify
RUN chmod +x /usr/local/bin/oidcify

# Clona o kong-opafy
WORKDIR /usr/local/kong/plugins/
RUN git clone https://github.com/produtoreativo/kong-opafy.git

# Instalar plugin Lua via LuaRocks
WORKDIR /usr/local/kong/plugins/kong-opafy
RUN luarocks make kong-opafy-0.1.0-1.rockspec

# Configurar variáveis para carregar os plugins
ENV KONG_PLUGINS="bundled,oidcify,kong-opafy"

# Configurar o plugin server somente para o oidcify (Go)
ENV KONG_PLUGINSERVER_NAMES="oidcify"
ENV KONG_PLUGINSERVER_OIDCIFY_QUERY_CMD="/usr/local/bin/oidcify -dump"
ENV KONG_PLUGINSERVER_OIDCIFY_START_CMD="/usr/local/bin/oidcify"

USER kong

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["kong", "docker-start"]