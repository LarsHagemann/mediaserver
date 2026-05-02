#!/usr/bin/env sh
# ================================================================================
# File: env.sh
# Description: Replaces environment variables in asset files.
# Usage: Run this script in your terminal, ensuring APP_PREFIX and ASSET_DIRS are set.
# ================================================================================

# Set the exit flag to exit immediately if any command fails
set -e

APP_PREFIX="MEDIASERVER_"
ASSET_DIR="/var/www/html"

while [ $# -gt 0 ]; do
    case "$1" in
        --app-prefix)
            APP_PREFIX="$2"
            shift 2
            ;;
        --asset-dirs)
            ASSET_DIR="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            exit 1
            ;;
    esac
done

if [ ! -d "$ASSET_DIR" ]; then
    echo "Warning: directory '$ASSET_DIR' not found, skipping."
    continue
fi

echo "Scanning directory: $ASSET_DIR"

env | grep "^${APP_PREFIX}" | while IFS='=' read -r key value; do
    echo "  • Replacing ${key} → ${value}"

    set +e
    find "$ASSET_DIR" -type f \
        -exec sed -i "s|${key}|${value}|g" {} +
    
    if [ $? -ne 0 ]; then
        echo "    ! Warning: Failed to replace ${key} in some files."
    fi

    set -e
done

echo "Environment variable replacement completed."
