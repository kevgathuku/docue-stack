(ns docue.db
  (:require [migratus.core :as migratus]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]))

(def unqualified {:builder-fn rs/as-unqualified-lower-maps})

(defn app-env []
  (or (System/getenv "APP_ENV") "dev"))

(defn base-url []
  (or (System/getenv "APP_URL")
      (str "http://localhost:" (or (System/getenv "PORT") "8000"))))

(defn db-file
  ([] (db-file (app-env) (System/getenv "SQLITE_FILE")))
  ([env sqlite-file]
   (or sqlite-file
       (case env
         "prod" (throw (ex-info "SQLITE_FILE is required in prod" {}))
         "test" "docue_test.db"
         "docue.db"))))

(defn db-url
  ([] (db-url (app-env) (System/getenv "SQLITE_FILE")))
  ([env sqlite-file]
   (str "jdbc:sqlite:" (db-file env sqlite-file) "?foreign_keys=on&journal_mode=WAL")))

(defn datasource []
  (jdbc/get-datasource {:jdbcUrl (db-url)}))

(defn migratus-config []
  {:store :database
   :migration-dir "migrations"
   :db {:connection-uri (db-url)}})

(defn migrate! []
  (migratus/migrate (migratus-config)))
