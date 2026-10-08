(ns docue.magic
  (:require [clojure.string :as str]
            [docue.db :as db]
            [docue.mail :as mail]
            [docue.tokens :as tokens]
            [docue.users :as users]
            [next.jdbc :as jdbc]))

(def link-expiry-minutes 15)
(def resend-cooldown-seconds 60)

(defn email-like? [s]
  (boolean (and (string? s) (re-find #"^[^@\s]+@[^@\s]+\.[^@\s]+$" s))))

(defn- recent-token? [user-id]
  (:exists
   (jdbc/execute-one!
    (db/datasource)
    [(str "SELECT EXISTS(SELECT 1 FROM login_tokens WHERE user_id = ?"
          " AND created_at > now() - make_interval(secs => CAST(? AS integer))) AS exists")
     user-id resend-cooldown-seconds]
    db/unqualified)))

(defn- store-token! [user-id]
  (let [token (tokens/random-hex)]
    (jdbc/execute-one!
     (db/datasource)
     [(str "INSERT INTO login_tokens(user_id, token_hash, expires_at)"
           " VALUES(?,?, now() + make_interval(mins => CAST(? AS integer)))")
      user-id (tokens/sha256-hex token) link-expiry-minutes])
    token))

(defn- base-url []
  (or (System/getenv "APP_URL")
      (str "http://localhost:" (or (System/getenv "PORT") "8000"))))

(defn- send-to! [user]
  (when-not (recent-token? (:id user))
    (let [token (store-token! (:id user))]
      (mail/send-login-link! (:email user) (str (base-url) "/auth/" token)))))

(defn request-link!
  "Sends a login link for an email (creating the account on first use)
  or a username (resolving to the stored email). Unknown non-email
  identifiers are rejected with :unknown-identifier. Throttled per
  account; always safe to call."
  [identifier]
  (let [identifier (str/trim (or identifier ""))]
    (if-let [user (users/find-by-login identifier)]
      (send-to! user)
      (if (email-like? identifier)
        (let [id (users/create! identifier identifier)]
          (send-to! {:id id :email identifier}))
        :unknown-identifier))))

(defn verify-link!
  "Returns the user id for a valid token, consuming it. nil otherwise."
  [token]
  (let [row (jdbc/execute-one!
             (db/datasource)
             [(str "SELECT id, user_id FROM login_tokens"
                   " WHERE token_hash = ? AND expires_at > now()")
              (tokens/sha256-hex (or token ""))]
             db/unqualified)]
    (when row
      (jdbc/execute-one!
       (db/datasource)
       ["DELETE FROM login_tokens WHERE id = ?" (:id row)])
      (:user_id row))))
