FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 9000
CMD ["node", "index.js"]
