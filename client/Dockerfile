# Build static assets (Vite embeds VITE_* at build time)
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SERVER_URL=http://localhost:9000
ARG VITE_SERVER_URL_DEVELOPMENT=http://localhost:9000
ARG VITE_OAUTH_CLIENT_ID=
ARG VITE_CHAT_RESPONSE_MODE=streaming

ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_SERVER_URL_DEVELOPMENT=$VITE_SERVER_URL_DEVELOPMENT
ENV VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID
ENV VITE_CHAT_RESPONSE_MODE=$VITE_CHAT_RESPONSE_MODE

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
