#!/usr/bin/env bash

set -e

STAGE=${1}

# populate API config
source $(dirname "$0")/${STAGE}
sed -e "s*__URL__*${URL}*g" \
    -e "s*__KEY__*${KEY}*g" \
    $(dirname "$0")/config.template > $(dirname "$0")/config.js

echo "Config has been generated in $(pwd)/"
