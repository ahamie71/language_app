FROM node:22-alpine

# Point d'attention 2 : Alpine n'embarque ni bash ni curl par defaut
RUN apk add --no-cache bash curl

WORKDIR /app

COPY package*.json ./

# Point d'attention 1 : outils de compilation pour d'eventuels modules natifs.
# Installes en paquet "virtuel" puis retires apres npm install.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
 && npm install \
 && apk del .build-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
