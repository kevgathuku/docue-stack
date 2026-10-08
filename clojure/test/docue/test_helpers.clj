(ns docue.test-helpers
  (:require [buddy.hashers :as hashers]
            [clojure.string :as str]
            [docue.db :as db]
            [docue.markdown :as markdown]
            [docue.router :as router]
            [next.jdbc :as jdbc]
            [ring.mock.request :as mock]))

(defn migrate-once [f]
  (db/migrate!)
  (f))

(defn form-post [path params]
  (-> (mock/request :post path)
      (mock/content-type "application/x-www-form-urlencoded")
      (mock/body (->> params
                      (map (fn [[k v]] (str (name k) "=" v)))
                      (str/join "&")))))

(defn session-cookie [resp]
  (-> (get-in resp [:headers "Set-Cookie"])
      first
      (str/split #";")
      first
      str/trim))

(defn login! [username password]
  (router/app (form-post "/login" {:username username :password password})))

(defn authed-get [path cookie]
  (router/app (-> (mock/request :get path)
                  (mock/header "Cookie" cookie))))

(defn create-user!
  ([username password]
   (create-user! username username password))
  ([username name password]
   (jdbc/execute! (db/datasource)
                  ["INSERT INTO users(username, name, password_hash) VALUES(?,?,?)"
                   username name (hashers/derive password)])))

(defn login-cookie! [username password]
  (create-user! username password)
  (session-cookie (login! username password)))

(defn user-id [username]
  (:id (jdbc/execute-one! (db/datasource)
                           ["SELECT id FROM users WHERE username = ?" username]
                           db/unqualified)))

(defn note-id [title]
  (:id (jdbc/execute-one! (db/datasource)
                           ["SELECT id FROM notes WHERE title = ?" title]
                           db/unqualified)))

(defn clean-db [f]
  (when (not= "test" (db/app-env))
    (throw (ex-info "Refusing to wipe the database outside the test env (run with APP_ENV=test)" {})))
  (jdbc/execute! (db/datasource) ["DELETE FROM notes"])
  (jdbc/execute! (db/datasource) ["DELETE FROM users"])
  (try
    (f)
    (finally
      (jdbc/execute! (db/datasource) ["DELETE FROM notes"])
      (jdbc/execute! (db/datasource) ["DELETE FROM users"]))))

(defn create-note!
  ([owner-username title content-md tags]
   (jdbc/execute! (db/datasource)
                   [(str "INSERT INTO notes(title, content_md, content_html, tags, owner_id)"
                         " VALUES(?,?,?,?,?)")
                    title content-md (markdown/render content-md) (into-array String tags)
                    (user-id owner-username)])))
