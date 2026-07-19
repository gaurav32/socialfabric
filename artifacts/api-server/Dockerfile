FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY . .
RUN pnpm --filter @workspace/api-server build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY --from=build /app/artifacts/api-server/dist /app/artifacts/api-server/dist
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

EXPOSE 3000
CMD ["pnpm", "--dir", "artifacts/api-server", "start"]
