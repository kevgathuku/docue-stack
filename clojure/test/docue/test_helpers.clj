(ns docue.test-helpers
  (:require [docue.mail :as mail]
            [clojure.string :as str]
            [docue.db :as db]
            [docue.markdown :as markdown]
            [docue.router :as router]
            [docue.tokens :as tokens]
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

(defn authed-get [path cookie]
  (router/app (-> (mock/request :get path)
                  (mock/header "Cookie" cookie))))

(defn create-user! [username email]
  (jdbc/execute! (db/datasource)
                 ["INSERT INTO users(username, email) VALUES(?,?)" username email]))

(defn capture-mail [f]
  (let [sent (atom [])]
    (with-redefs [mail/send-login-link!
                   (fn [email link]
                     (swap! sent conj {:to email :link link})
                     {:sent true})]
      (f sent))))

(defn request-link! [identifier]
  (router/app (form-post "/login" {:identifier identifier})))

(defn magic-cookie! [identifier]
  (capture-mail
   (fn [sent]
     (request-link! identifier)
     (let [link (:link (first @sent))
           token (last (str/split link #"/"))]
       (session-cookie (router/app (mock/request :get (str "/auth/" token))))))))

(defn user-id [username-or-email]
  (:id (jdbc/execute-one! (db/datasource)
                           [(str "SELECT id FROM users"
                                 " WHERE username = ? OR email = ?")
                            username-or-email username-or-email]
                           db/unqualified)))

(defn note-id [title]
  (:id (jdbc/execute-one! (db/datasource)
                           ["SELECT public_id AS id FROM notes WHERE title = ?" title]
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
                   [(str "INSERT INTO notes(title, content_md, content_html, tags, owner_id, public_id)"
                         " VALUES(?,?,?,?,?,?)")
                    title content-md (markdown/render content-md) (into-array String tags)
                    (user-id owner-username) (tokens/short-id "note")])))
