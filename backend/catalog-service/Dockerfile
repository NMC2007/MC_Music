# Stage 1: Build shared-auth-lib and catalog-service
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /workspace

# 1. Build và xuất bản shared-auth-lib vào local Maven bên trong container
COPY shared-auth-lib/ shared-auth-lib/
WORKDIR /workspace/shared-auth-lib
RUN chmod +x gradlew && ./gradlew publishToMavenLocal --no-daemon

# 2. Build catalog-service
WORKDIR /workspace
COPY catalog-service/ catalog-service/
WORKDIR /workspace/catalog-service
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

# Stage 2: Minimal Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Tạo non-root user cho mục đích bảo mật
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy duy nhất file bootJar thực thi (loại trừ plain jar)
COPY --from=builder /workspace/catalog-service/build/libs/*[!plain].jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
