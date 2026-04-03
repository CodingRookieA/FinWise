# Vite reads `client/.env` during `npm run build` (file must be in build context — not listed in .dockerignore).
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_OAUTH_CLIENT_ID
ARG VITE_SERVER_URL
ARG VITE_CHAT_RESPONSE_MODE
ARG MODE
ARG VITE_CANARY_CLIENT_URL
ARG VITE_CANARY_SERVER_URL

ENV VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_CHAT_RESPONSE_MODE=$VITE_CHAT_RESPONSE_MODE
ENV MODE=$MODE
ENV VITE_CANARY_CLIENT_URL=$VITE_CANARY_CLIENT_URL
ENV VITE_CANARY_SERVER_URL=$VITE_CANARY_SERVER_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
