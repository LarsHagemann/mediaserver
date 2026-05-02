#!/usr/bin/env bash
set -e

SCRIPT_DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)

"$SCRIPT_DIR/build-server-image.sh"
"$SCRIPT_DIR/build-frontend-image.sh"
