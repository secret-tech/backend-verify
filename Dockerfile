FROM mhart/alpine-node:6.11.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD package.json /usr/src/app
RUN npm i
ADD . /usr/src/app
EXPOSE 3001
EXPOSE 4001
CMD npm start
