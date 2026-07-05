FROM node:18-alpine

WORKDIR /server

COPY server/package*.json ./
RUN npm install

COPY server ./
COPY server/data/ data/

EXPOSE 4000

CMD ["node", "index.js"]
