(ns docue.users
  (:require [buddy.hashers :as hashers]
            [docue.db :as db]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]))

(def ^:private unqualified {:builder-fn rs/as-unqualified-lower-maps})

(defn find-by-username [username]
  (jdbc/execute-one! (db/datasource)
                     ["SELECT id, username, name, password_hash FROM users WHERE username = ?"
                      username]
                     unqualified))

(defn create! [username name password]
  (jdbc/execute! (db/datasource)
                 ["INSERT INTO users(username, name, password_hash) VALUES(?,?,?)"
                  username name (hashers/derive password)]))

(defn all []
  (jdbc/execute! (db/datasource)
                 ["SELECT id, username, name FROM users ORDER BY username"]
                 unqualified))

(defn any? []
  (pos? (:count (jdbc/execute-one! (db/datasource)
                                   ["SELECT COUNT(*) AS count FROM users"]
                                   unqualified))))

(defn ensure-admin!
  "Creates the default admin user when the database is empty and a password
  is given. Called on boot with ADMIN_PASSWORD."
  [admin-password]
  (when (and admin-password (not (any?)))
    (create! "admin" "Administrator" admin-password)))
