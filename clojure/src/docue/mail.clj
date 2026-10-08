(ns docue.mail
  (:require [clojure.string :as str]
            [docue.db :as db]
            [postal.core :as postal]))

(defn- smtp-config []
  (let [env (System/getenv)
        missing (remove #(get env %) ["SMTP_HOST" "SMTP_USER" "SMTP_PASS" "MAIL_FROM"])]
    (when (seq missing)
      (throw (ex-info (str "Missing SMTP config in prod: " (str/join ", " missing)) {})))
    {:host (get env "SMTP_HOST")
     :port (Integer/parseInt (or (get env "SMTP_PORT") "587"))
     :user (get env "SMTP_USER")
     :pass (get env "SMTP_PASS")
     :tls true}))

(defn- from-address []
  (or (System/getenv "MAIL_FROM") "docue@localhost"))

(defn send-login-link!
  "Sends the login link. Console in dev/test (returned for visibility),
  SMTP in prod. Returns a summary map."
  [email link]
  (if (= "prod" (db/app-env))
    (do (postal/send-message (smtp-config)
                             {:from (from-address)
                              :to email
                              :subject "Log in to Docue"
                              :body (str "Click to log in (expires in 15 minutes):\n" link)})
        {:sent true :to email})
    (do (println (str "Login link for " email ": " link))
        {:sent true :to email :link link})))
