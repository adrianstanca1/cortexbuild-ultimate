# CortexBuild Ultimate - Production Dockerfile (Vite + API)
FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Development image
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
EXPOSE 5173

CMD ["npm", "run", "dev"]

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build

# API Builder - Install server dependencies including OAuth
FROM base AS api-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm install --production
# Install OAuth packages
RUN npm install passport passport-google-oauth20 passport-microsoft express-session --save

# API Runner
FROM base AS api-runner
WORKDIR /app
COPY --from=api-deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /app/server
CMD ["node", "index.js"]

# Production runner - Lightweight static server
FROM nginx:alpine AS runner

# Remove default nginx config
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|svg|woff2?|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]