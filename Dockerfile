# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN npm install --global bun@1.3.14

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG TURISMO_API_URL
ARG NEXT_PUBLIC_TURISMO_API_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURISMO_API_URL=${TURISMO_API_URL}
ENV NEXT_PUBLIC_TURISMO_API_URL=${NEXT_PUBLIC_TURISMO_API_URL}

RUN node scripts/copy-maplibre-worker.mjs && node ./node_modules/next/dist/bin/next build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
