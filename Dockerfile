FROM node:14-alpine as base

WORKDIR /var/app

COPY . /var/app/

RUN yarn --force --non-interactive --frozen-lockfile --ignore-optional

RUN yarn build

# Add Tini
ENV TINI_VERSION v0.18.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-static /tini
RUN chmod +x /tini

ENTRYPOINT ["/tini", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node /var/app/healthCheck.js

# start the app
CMD [ "yarn", "run", "start" ]
