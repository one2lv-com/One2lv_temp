FROM node:20.18-alpine3.20

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
