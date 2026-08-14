# Dockerfile para aplicação React (Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências com pnpm (frozen-lockfile garante versões exatas)
RUN pnpm install --frozen-lockfile 

# Copiar código fonte
COPY . .

# ARG recebe o --build-arg do CI; ENV expõe para o processo de build do Vite.
# Substitui o antigo `COPY .env` — as variáveis vêm do GitHub, não de arquivo
# versionado, e o bundle deixa de depender de um .env presente no contexto.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build da aplicação
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
