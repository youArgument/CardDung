FROM node:18-alpine

WORKDIR /server

COPY server/package*.json ./
RUN npm install

COPY server ./

EXPOSE 4000

CMD ["node", "index.js"]
