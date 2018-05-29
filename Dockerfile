FROM node:carbon
WORKDIR /usr/src/app
COPY . .
RUN npm install --only=production
EXPOSE 4001
CMD [ "npm", "start" ]