(ns docue.users
  (:require [docue.db :as db]
            [next.jdbc :as jdbc]))

(defn find-by-email [email]
  (jdbc/execute-one! (db/datasource)
                     ["SELECT id, username, email FROM users WHERE email = ?"
                      email]
                     db/unqualified))

(defn find-by-username [username]
  (jdbc/execute-one! (db/datasource)
                     ["SELECT id, username, email FROM users WHERE username = ?"
                      username]
                     db/unqualified))

(defn find-by-login [login]
  (jdbc/execute-one! (db/datasource)
                     [(str "SELECT id, username, email FROM users"
                           " WHERE email = ? OR username = ?")
                      login login]
                     db/unqualified))

(defn create! [username email]
  (:id (jdbc/execute-one! (db/datasource)
                          ["INSERT INTO users(username, email) VALUES(?,?) RETURNING id"
                           username email]
                          db/unqualified)))
