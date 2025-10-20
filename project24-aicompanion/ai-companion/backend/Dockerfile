# Single stage build for Spring Boot backend
FROM openjdk:21-jdk-slim

# Install Maven
RUN apt-get update && \
    apt-get install -y curl wget && \
    wget https://archive.apache.org/dist/maven/maven-3/3.9.4/binaries/apache-maven-3.9.4-bin.tar.gz && \
    tar -xzf apache-maven-3.9.4-bin.tar.gz -C /opt && \
    ln -s /opt/apache-maven-3.9.4 /opt/maven && \
    rm apache-maven-3.9.4-bin.tar.gz && \
    rm -rf /var/lib/apt/lists/*

# Set Maven environment
ENV MAVEN_HOME=/opt/maven
ENV PATH=${MAVEN_HOME}/bin:${PATH}

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies (for better layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Copy the built jar
RUN mv target/*.jar app.jar

# Copy .env file for configuration
COPY .env /app/.env

# Create non-root user for security and set ownership
RUN groupadd -r spring && useradd -r -g spring spring && \
    chown -R spring:spring /app || true

USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
