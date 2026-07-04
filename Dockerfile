FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Auto-increment patch version on each build
RUN if [ -f VERSION ]; then IFS='.' read -r major minor patch < VERSION; patch=$((patch + 1)); echo "$major.$minor.$patch" > VERSION; fi

EXPOSE 3000

CMD ["npx", "http-server", "-p", "3000", "--cors"]
