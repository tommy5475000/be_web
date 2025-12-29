FROM node:18

WORKDIR /usr/share/be

COPY package.json .

RUN yarn install

COPY prisma ./prisma

COPY .env ./

RUN yarn prisma generate

COPY . .

CMD ["sh", "-c", "yarn start:dev & yarn start:kiot & yarn start:webhook"]



