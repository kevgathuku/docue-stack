# Prod image: uberjar built in-stage, run on a slim JRE (no Clojure CLI at runtime).
# Local dev skips Docker entirely: `clojure -T:build uber && java -jar target/docue.jar`.
# clojure/Dockerfile is the source-run fallback (Fly).
FROM clojure:temurin-26-tools-deps-bookworm-slim AS build

WORKDIR /build

# Dependencies first for layer caching
COPY clojure/deps.edn clojure/build.clj ./
RUN clojure -P

COPY clojure/src src
COPY clojure/resources resources
RUN clojure -T:build uber

FROM eclipse-temurin:26-jre

WORKDIR /app
COPY --from=build /build/target/docue.jar ./

ENV PORT=8000
EXPOSE 8000

CMD ["java", "-jar", "docue.jar"]
