FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY admin/ ./

EXPOSE 5000

CMD ["npx", "http-server", "-p", "5000", "--cors"]
