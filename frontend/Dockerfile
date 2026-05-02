FROM node:20 AS builder

WORKDIR /usr/src/app

COPY frontend/package*.json ./
RUN npm install --ignore-scripts

COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/index.html ./
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY plugin/frontend-types ../plugin/frontend-types

ENV VITE_BACKEND_URL=MEDIASERVER_BACKEND_URL
ENV VITE_WEBSOCKET_URL=MEDIASERVER_WEBSOCKET_URL

RUN npm run build

FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /usr/src/app/dist /var/www/html/

COPY frontend/env.sh /docker-entrypoint.d/env.sh
RUN dos2unix /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

COPY frontend/public/manifest.json /var/www/html/manifest.json

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
