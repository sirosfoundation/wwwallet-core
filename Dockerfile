FROM node:22

WORKDIR /app

COPY . .

RUN npm ci

CMD ["npm", "run", "start"]
