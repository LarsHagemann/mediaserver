FROM node:20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY assets/db ./assets/db
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM node:20

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    imagemagick \
    ghostscript \
    ffmpeg

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/assets ./assets
COPY ./assets/icons ./assets/icons
COPY ./package*.json ./

RUN sed 's/<\/policymap>/  <policy domain="coder" rights="read | write" pattern="PDF" \/>\n<\/policymap>/' \ 
    -i /etc/ImageMagick-6/policy.xml

ARG APP_VERSION=unknown
ARG COMMITHASH=unknown
ENV APP_VERSION=${APP_VERSION}
ENV COMMITHASH=${COMMITHASH}
ENV MIGRATIONS_DIR=./assets/db/migrations
ENV DEFAULT_THUMBNAIL_PATH=./assets/icons/unknown_file.jpg
ENV IGNORE_MIGRATION_CHECKSUM_MISMATCHES=false
ENV MAX_FILE_UPLOAD_SIZE=2147483648
ENV STAGE=production
ENV BACKEND_PORT=8080

RUN npm install --omit=dev

COPY ./manifest.json ./manifest.json

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 CMD curl -f http://localhost:${BACKEND_PORT}/health || exit 1

CMD ["node", "dist/index.js"]