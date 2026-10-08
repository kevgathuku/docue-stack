(ns docue.core
  (:require [docue.db :as db]
            [docue.router :as router]
            [ring.adapter.jetty :as jetty])
  (:gen-class))

(defn -main [& _args]
  (db/migrate!)
  (let [port (Integer/parseInt (or (System/getenv "PORT") "8000"))]
    (jetty/run-jetty router/app {:port port :join? true})))
