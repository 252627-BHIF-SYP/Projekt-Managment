FROM node:20-alpine AS build
WORKDIR /app
ARG BUILD_CONFIGURATION=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration $BUILD_CONFIGURATION

FROM nginx:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/school-project-management/browser /usr/share/nginx/html
EXPOSE 80
