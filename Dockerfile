FROM node:15.11.0-alpine
LABEL AUTHOR="yi-ge"
LABEL maintainer="a@wyr.me"

RUN apk add --no-cache \
  libstdc++ \
  libgcc \
  rsync \
  openssh-client \
  bash \
  ca-certificates \
  git

RUN mkdir /project

ADD . /project

WORKDIR /project

EXPOSE 80

CMD ["npm", "start"]