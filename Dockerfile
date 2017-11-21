FROM mhart/alpine-node:8.5

ADD . /usr/src/app
WORKDIR /usr/src/app
EXPOSE 3000
EXPOSE 4000
