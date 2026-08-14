# Docker Setup - Site Dr. Stanley

Este projeto foi configurado para executar em container Docker com Nginx e proxy reverso Traefik.

## Estrutura

```
├── Dockerfile              # Multi-stage build (Node.js + Nginx)
├── nginx.conf              # Configuração do Nginx
├── docker-compose.yml      # Orquestração com Traefik
└── README-docker.md        # Esta documentação
```

## Arquivos de Configuração

### Dockerfile
- **Stage 1**: Build da aplicação React/Vite com Node.js 20
- **Stage 2**: Serve arquivos estáticos com Nginx Alpine

### nginx.conf
- Configuração básica para servir SPA (Single Page Application)
- Suporte a roteamento client-side com `try_files`
- Serve na porta 80

### docker-compose.yml
- Serviço `frontend` com labels Traefik
- Configurado para domínio `portal.mibitech.com.br`
- SSL/TLS com Let's Encrypt
- Rede externa `rede_mibi`

## Comandos para Build e Deploy

### 1. Build e Subir o Container (com Traefik)
```bash
# Build e deploy em um comando
docker-compose up -d --build

# Ou separadamente:
# docker build -t site:latest .
# docker-compose up -d
```

### 3. Verificar Status
```bash
docker-compose ps
docker logs site
```

### 4. Parar o Container
```bash
docker-compose down
```

## Requisitos

- Docker e Docker Compose instalados na VPS
- Rede externa `rede_mibi` criada
- Traefik configurado na mesma rede
- DNS apontando `portal.mibitech.com.br` para o servidor
- Arquivos do projeto copiados para a VPS (incluindo .env)

## Setup na VPS

### 1. Copiar arquivos para VPS
```bash
# Fazer upload dos arquivos via scp, rsync ou git clone
scp -r projeto/ usuario@vps:/caminho/destino/

# Ou via git
git clone <repositorio> /caminho/destino/
```

## Criação da Rede (se necessário)
```bash
docker network create rede_mibi
```

## Logs e Debug
```bash
# Logs do container
docker logs site -f

# Acessar container
docker exec -it site sh

# Verificar arquivos servidos
docker exec -it site ls -la /usr/share/nginx/html
```

## Variáveis de Ambiente

As variáveis do `.env` são incluídas no build do Vite automaticamente. Não é necessário configuração adicional para produção/desenvolvimento neste setup.

## Acesso

- **Produção**: https://portal.mibitech.com.br (via Traefik)
- **Local**: http://localhost (se executar nginx diretamente)