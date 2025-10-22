FROM node:22-slim

RUN mkdir -p /usr/src/playground-be && chown -R node:node /usr/src/playground-be

WORKDIR /usr/src/playground-be

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --chown=node:node . .

USER node

EXPOSE 8080

CMD ["npm", "start"]

