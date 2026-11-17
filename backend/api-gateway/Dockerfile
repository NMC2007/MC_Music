# Stage 1: Build the application
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /workspace

COPY api-gateway/ api-gateway/
WORKDIR /workspace/api-gateway
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

# Stage 2: Minimal Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Tạo non-root user cho mục đích bảo mật
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy file bootJar thực thi (loại trừ file plain jar)
COPY --from=builder /workspace/api-gateway/build/libs/*[!plain].jar app.jar

EXPOSE 8686
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
