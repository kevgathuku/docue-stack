(ns docue.db
  (:require [migratus.core :as migratus]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]))

(def unqualified {:builder-fn rs/as-unqualified-lower-maps})

(defn app-env []
  (or (System/getenv "APP_ENV") "dev"))

(defn db-url
  ([] (db-url (app-env) (System/getenv "DATABASE_URL") (System/getenv "TEST_DATABASE_URL")))
  ([env database-url test-database-url]
   (case env
     "prod" (or database-url
                  (throw (ex-info "DATABASE_URL is required in prod" {})))
     "test" (or test-database-url "jdbc:postgresql://localhost:5432/docue_test")
     (or database-url "jdbc:postgresql://localhost:5432/docue"))))

(defn datasource []
  (jdbc/get-datasource {:jdbcUrl (db-url)}))

(defn migratus-config []
  {:store :database
   :migration-dir "migrations"
   :db {:connection-uri (db-url)}})

(defn migrate! []
  (migratus/migrate (migratus-config)))
