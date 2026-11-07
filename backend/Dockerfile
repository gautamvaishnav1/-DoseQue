# Production image for the Express API
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies (nodemon stays out)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only the source code (see .dockerignore)
COPY src ./src

EXPOSE 5000

# Run as the unprivileged "node" user instead of root
USER node

CMD ["node", "src/server.js"]
