FROM node:22-alpine
WORKDIR /app
COPY app.tar.gz.b64 /tmp/app.tar.gz.b64
RUN base64 -d /tmp/app.tar.gz.b64 > /tmp/app.tar.gz   && tar -xzf /tmp/app.tar.gz -C /app   && npm install --no-audit --no-fund   && npm run build   && rm -f /tmp/app.tar.gz /tmp/app.tar.gz.b64
ENV NODE_ENV=production
CMD ["npm","start"]
