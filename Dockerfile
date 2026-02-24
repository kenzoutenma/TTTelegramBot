# syntax=docker/dockerfile:1

ARG NODE_VERSION=23.7.0

################################################################################
# Stage 1: Base for building
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

################################################################################
# Stage 2: Install production dependencies
FROM base as deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Stage 3: Build the application
FROM base as build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

################################################################################
# Stage 4: Final Runtime
# Update this line from v1.50.0 to v1.52.0
FROM mcr.microsoft.com/playwright:v1.52.0-noble as final

# Set Node environment
ENV NODE_ENV production
WORKDIR /usr/src/app

# Copy the built app and dependencies from previous stages
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package.json .

# Since you are using the official Playwright image, browsers are pre-installed.
# No need to run 'npx playwright install' unless you need specific extra browsers.

EXPOSE 80

CMD ["npm", "start"]