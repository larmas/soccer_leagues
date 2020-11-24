FROM node:latest

# probar otro nombre directorio
WORKDIR /app 

CMD npm i && npm run dev

