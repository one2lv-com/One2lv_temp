FROM node:20.18-alpine3.20
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
RUN mkdir -p logs
EXPOSE 3000
CMD ["node", "server.js"]
