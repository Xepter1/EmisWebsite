FROM nginx:alpine

# Kopiere die statischen Dateien
COPY . /usr/share/nginx/html/

# Kopiere die Nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponiere Port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
