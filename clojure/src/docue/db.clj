(ns docue.db
  (:require [migratus.core :as migratus]
            [next.jdbc :as jdbc]))

(defn db-url []
  (or (System/getenv "DATABASE_URL")
      "jdbc:postgresql://localhost:5432/docue"))

(defn migratus-config []
  {:store :database
   :migration-dir "migrations"
   :db {:connection-uri (db-url)}})

(defn migrate! []
  (migratus/migrate (migratus-config)))
