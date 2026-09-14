FROM node:14-alpine AS build

WORKDIR /var/app

COPY package.json yarn.lock /var/app/

RUN yarn --force --non-interactive --frozen-lockfile --ignore-optional

COPY . /var/app/

RUN yarn generate

# serve the generated SPA
FROM nginx:1.31-alpine

ENV PORT=3000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /var/app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/" || exit 1
