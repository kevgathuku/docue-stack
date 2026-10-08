# Official Clojure image: Temurin + Clojure CLI preinstalled. Deliberately
# no apt steps — they add failure modes (e.g. mirror hash mismatches)
# for tools we don't need (no git deps in deps.edn).
FROM clojure:temurin-26-tools-deps-bookworm-slim

WORKDIR /app

# Dependencies first for layer caching
COPY deps.edn ./
RUN clojure -P

COPY src src
COPY resources resources

ENV PORT=8000
EXPOSE 8000

CMD ["clojure", "-M", "-m", "docue.core"]
