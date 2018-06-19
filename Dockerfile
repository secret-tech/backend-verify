FROM mhart/alpine-node:8.9.1

WORKDIR /usr/src/app

COPY . .
COPY custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

RUN chmod 755 /usr/local/bin/custom-entrypoint.sh && \
    addgroup verify && \
    adduser -D -H -G verify verify && \
    yarn install

EXPOSE 3000
EXPOSE 4000

USER verify

ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["npm", "start"]
