# The practice site as a container — the dogfood rig's app under test.
#
# Why a container (owner, 2026-10-17): served by the host's Homebrew node, every
# daily `brew upgrade` deleted the binary under the running server, and the
# macOS application firewall (stealth mode, allow-listed per node Cellar path)
# then closed every LAN connection while localhost still answered. The
# simulator reaches the site by the LAN address, so appium lost every run from
# 12:16 to 15:30 that day — the same failure as 2026-10-02. Docker Desktop's
# published ports are allowed once, for Docker, so this needs no approval and
# no host node at all.
#
# REST_UPSTREAM is read by next.config.ts at BUILD time (rewrites are baked
# into the routes manifest), so it is a build argument naming the PostgREST
# container on the shared Docker network.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG REST_UPSTREAM=http://testsite-postgrest:3000
ENV REST_UPSTREAM=$REST_UPSTREAM NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
