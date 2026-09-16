# Build the SPA and serve dist/ with nginx. There is no application server: the
# app renders entirely in the browser, so the runtime stage is nginx alone.
FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# GIT_SHA is baked into the bundle so the served build is identifiable.
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}
# Sentry DSN, baked at build time. A DSN is public by design (it ships in the
# bundle); it is passed in rather than committed so this public repo does not
# carry it, and an empty value simply disables reporting.
ARG SENTRY_DSN=""
ENV SENTRY_DSN=${SENTRY_DSN}
# The Hivesigner API that serves the ranked app directory. Baked at build time
# like the DSN, because this is a static bundle with nothing to read at runtime.
# Empty means the public API; a deployment can point somewhere else. Declared
# here because rsbuild.config.ts only ever sees the build environment, so
# without this the documented override could not be used by the deploy path
# that actually builds the image.
ARG API_URL=""
ENV API_URL=${API_URL}
# The public origin, for canonical and Open Graph URLs (absolute by spec).
ARG SITE_URL=""
ENV SITE_URL=${SITE_URL}
RUN pnpm build

# serve the static build
FROM nginx:1.31-alpine

ENV PORT=3000

# nginx:alpine substitutes ${PORT} in templates into conf.d at start.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1
