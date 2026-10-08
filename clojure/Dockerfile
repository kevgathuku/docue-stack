FROM eclipse-temurin:27-jre

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates git \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://download.clojure.org/install/linux-install.sh -o /tmp/install.sh \
 && bash /tmp/install.sh \
 && rm /tmp/install.sh

WORKDIR /app

# Dependencies first for layer caching
COPY deps.edn ./
RUN clojure -P

COPY src src
COPY resources resources

ENV PORT=8000
EXPOSE 8000

CMD ["clojure", "-M", "-m", "docue.core"]
