FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Lưu ý: Tuỳ thuộc vào Angular.json, đường dẫn build có thể là /dist/jurishub-client/browser hoặc /dist/jurishub-client
COPY --from=builder /app/dist/jurishub-client/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
