# docker-loghose
#
# VERSION 0.2.0

FROM mhart/alpine-node:4
MAINTAINER Matteo Collina <hello@matteocollina.com>

WORKDIR /src
ADD . .

RUN npm install --production

CMD ["npm", "start"]
