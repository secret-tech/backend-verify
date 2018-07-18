FROM mhart/alpine-node:10

WORKDIR /usr/src/app

COPY . .
COPY custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

RUN chmod 755 /usr/local/bin/custom-entrypoint.sh && \
    addgroup verify && \
    adduser -D -G verify verify && \
    yarn install

EXPOSE 3000
EXPOSE 4000

USER verify

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["npm", "start"]
