FROM node:20-alpine AS service-builder

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GTAG_ID
ARG NEXT_PUBLIC_GTAG_CALL_CONVERSION
ARG NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE

ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GTAG_ID=${NEXT_PUBLIC_GTAG_ID}
ENV NEXT_PUBLIC_GTAG_CALL_CONVERSION=${NEXT_PUBLIC_GTAG_CALL_CONVERSION}
ENV NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE=${NEXT_PUBLIC_GTAG_CALL_CONVERSION_TOLLFREE}

WORKDIR /rig-ads-website
COPY . .

RUN npm install && npm run build


FROM node:20-alpine AS service-runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=service-builder /rig-ads-website/public ./public
COPY --from=service-builder /rig-ads-website/package.json ./package.json

COPY --from=service-builder --chown=nextjs:nodejs /rig-ads-website/.next/standalone ./
COPY --from=service-builder --chown=nextjs:nodejs /rig-ads-website/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT 8080

CMD ["node", "server.js"]
