#!/usr/bin/env bash

SCRIPT_DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
ROOT_DIR=$(realpath "$SCRIPT_DIR/..")

docker build -t mediaserver-frontend-dev:latest -f $ROOT_DIR/frontend/Dockerfile $ROOT_DIR
