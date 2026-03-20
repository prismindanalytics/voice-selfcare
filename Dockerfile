FROM node:18-alpine

WORKDIR /app

# Build tools needed by some native npm dependencies
RUN apk add --no-cache python3 make g++ linux-headers

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["node", "src/index.js"]
