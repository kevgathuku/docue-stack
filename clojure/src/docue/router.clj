(ns docue.router
  (:require [clojure.data.json :as json]
            [clojure.string :as str]
            [docue.views :as views]
            [reitit.ring :as ring]))

(defn- json-resp [status body]
  {:status status
   :headers {"Content-Type" "application/json"}
   :body (json/write-str body)})

(defn- not-found [{:keys [uri]}]
  (if (str/starts-with? uri "/api")
    (json-resp 404 {:error "Not Found"})
    {:status 404
     :headers {"Content-Type" "text/html"}
     :body (views/not-found-page)}))

(def app
  (ring/ring-handler
   (ring/router
    [["/api/health"
      {:get (fn [_]
              (json-resp 200 {:status "ok"
                              :timestamp (str (java.time.Instant/now))
                              :service "docue-api"}))}]])
   (ring/create-default-handler {:not-found not-found})))
