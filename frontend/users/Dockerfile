# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Xóa các file tĩnh mặc định của Nginx
RUN rm -rf ./*

# Copy bundle từ builder stage
COPY --from=builder /app/dist .

# Copy file cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

