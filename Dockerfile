FROM node:slim

COPY . .

RUN npm install
RUN npm run pack

ENTRYPOINT ["node", "/dist/index.js"]