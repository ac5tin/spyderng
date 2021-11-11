FROM node:17-alpine


# - src files
COPY . /

RUN  apk add --no-cache chromium chromium git nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV CHROMIUM_PATH /usr/bin/chromium-browser

# nodejs install dependencies
RUN yarn

# build
RUN yarn build

# start + expose ports
CMD yarn start
