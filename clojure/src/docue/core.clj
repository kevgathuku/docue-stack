(ns docue.core
  (:require [docue.db :as db]
            [docue.router :as router]
            [docue.users :as users]
            [ring.adapter.jetty :as jetty])
  (:gen-class))

(defn -main [& _args]
  (db/migrate!)
  (users/ensure-admin! (System/getenv "ADMIN_PASSWORD"))
  (let [port (Integer/parseInt (or (System/getenv "PORT") "8000"))]
    (println (format "Docue (%s) listening on http://localhost:%d" (db/app-env) port))
    (jetty/run-jetty router/app {:port port :join? true})))
