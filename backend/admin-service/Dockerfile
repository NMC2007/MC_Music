# Stage 1: Build shared-auth-lib and admin-service
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /workspace

# 1. Build và xuất bản shared-auth-lib vào local Maven bên trong container
COPY shared-auth-lib/ shared-auth-lib/
WORKDIR /workspace/shared-auth-lib
RUN chmod +x gradlew && ./gradlew publishToMavenLocal --no-daemon

# 2. Build admin-service
WORKDIR /workspace
COPY admin-service/ admin-service/
WORKDIR /workspace/admin-service
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

# Stage 2: Minimal Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Tạo non-root user cho mục đích bảo mật
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy duy nhất file bootJar thực thi (loại trừ plain jar)
COPY --from=builder /workspace/admin-service/build/libs/*[!plain].jar app.jar

EXPOSE 8084
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
