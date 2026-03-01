FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable \
  && corepack prepare yarn@4.12.0 --activate \
  && yarn install --immutable

COPY . .
RUN yarn build

FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable \
  && corepack prepare yarn@4.12.0 --activate \
  && yarn install --immutable

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
