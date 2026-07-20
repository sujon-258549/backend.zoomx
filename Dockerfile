FROM node:20-alpine AS deps
WORKDIR /application
COPY package*.json ./
RUN npm ci

FROM deps AS build
WORKDIR /application
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /application
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /application/dist ./dist
COPY --from=build /application/src/templates ./src/templates

EXPOSE 5000

CMD ["node", "dist/server.js"]
