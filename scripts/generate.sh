#!/bin/sh
# Generate script that works with both Node 16.x and Node 20.x

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')

if [ "$NODE_VERSION" -ge 17 ]; then
  export NODE_OPTIONS=--openssl-legacy-provider
fi

nuxt-ts generate
