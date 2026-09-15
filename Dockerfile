# 1) Build del frontend
FROM node:24-alpine AS front
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# 2) Build del backend con el frontend adentro (static/)
FROM maven:3.9-eclipse-temurin-21 AS back
WORKDIR /src/backend
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=front /src/frontend/dist/frontend/browser ./src/main/resources/static
RUN mvn -q -B -DskipTests package

# 3) Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=back /src/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
