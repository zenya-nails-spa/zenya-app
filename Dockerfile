FROM node:20-alpine AS build
WORKDIR /app
ARG REACT_APP_API_URL
ARG REACT_APP_API_KEY
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_API_KEY=${REACT_APP_API_KEY}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && \
    mkdir -p admin_build/admin && \
    mv build/* admin_build/admin/ && \
    rm -rf build && \
    mv admin_build build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
