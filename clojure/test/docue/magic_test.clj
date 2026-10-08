(ns docue.magic-test
  (:require [clojure.string :as str]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [docue.db :as db]
            [docue.router :as router]
            [docue.test-helpers :as h]
            [docue.tokens :as tokens]
            [next.jdbc :as jdbc]
            [ring.mock.request :as mock]))

(use-fixtures :once h/migrate-once)
(use-fixtures :each h/clean-db)

(deftest request-link-new-email
  (h/capture-mail
   (fn [sent]
      (let [res (h/request-link! "new@x.com")]
        (is (= 200 (:status res)))
        (is (re-find #"Check your inbox" (:body res)))
        (is (= 1 (count @sent)))
        (is (= "new@x.com" (:to (first @sent)))))
        (is (re-find #"http://localhost:8000/auth/[0-9a-f]{64}" (:link (first @sent)))))))
(deftest request-link-username
  (h/capture-mail
   (fn [sent]
      (h/create-user! "ada" "ada@x.com")
      (let [res (h/request-link! "ada")]
        (is (= 200 (:status res)))
        (is (= 1 (count @sent)))
        (is (= "ada@x.com" (:to (first @sent))))))))
(deftest request-link-unknown-non-email
  (let [res (h/request-link! "notauser")]
    (is (= 422 (:status res)))
    (is (re-find #"email" (:body res)))))

(deftest verify-link-session
  (h/capture-mail
   (fn [sent]
      (h/request-link! "new@x.com")
      (let [token (last (str/split (:link (first @sent)) #"/"))
            res (router/app (mock/request :get (str "/auth/" token)))]
        (is (= 302 (:status res)))
        (is (= "/notes" (get-in res [:headers "Location"])))
        (let [notes (h/authed-get "/notes" (h/session-cookie res))]
          (is (= 200 (:status notes))))))))
(deftest verify-link-rejected
  (testing "expired, reused, and tampered tokens fail identically"
    (h/capture-mail
   (fn [sent]
        (h/request-link! "new@x.com")
        (let [token (last (str/split (:link (first @sent)) #"/"))
              good (router/app (mock/request :get (str "/auth/" token)))
              replay (router/app (mock/request :get (str "/auth/" token)))
              tampered (router/app (mock/request :get (str "/auth/" (apply str (reverse token)))))]
          (is (= 302 (:status good)))
          (is (= 404 (:status replay)))
          (is (= 404 (:status tampered)))
          (is (= (:body replay) (:body tampered))))))))
(deftest request-throttled
  (h/capture-mail
   (fn [sent]
      (h/request-link! "new@x.com")
      (h/request-link! "new@x.com")
      (is (= 1 (count @sent))))))
(deftest signup-page
  (let [res (router/app (mock/request :get "/signup"))]
    (is (= 200 (:status res)))
    (is (re-find #"username" (:body res)))
    (is (re-find #"email" (:body res)))
    (is (re-find #"/login" (:body res)))))

(deftest signup-creates-and-mails
  (h/capture-mail
   (fn [sent]
      (let [res (router/app (h/form-post "/signup" {:username "ada" :email "ada@x.com"}))]
        (is (= 200 (:status res)))
        (is (re-find #"Check your inbox" (:body res)))
        (is (= 1 (count @sent)))
        (is (= "ada@x.com" (:to (first @sent))))))))
(deftest signup-validation
  (h/create-user! "ada" "ada@x.com")
  (let [dup-user (router/app (h/form-post "/signup" {:username "ada" :email "other@x.com"}))
        dup-email (router/app (h/form-post "/signup" {:username "other" :email "ada@x.com"}))
        bad-email (router/app (h/form-post "/signup" {:username "bob" :email "not-an-email"}))]
    (is (= 422 (:status dup-user)))
    (is (re-find #"already taken" (:body dup-user)))
    (is (= 422 (:status dup-email)))
    (is (re-find #"already registered" (:body dup-email)))
    (is (= 422 (:status bad-email)))
    (is (re-find #"valid email" (:body bad-email)))))

(deftest verify-link-expired
  (h/capture-mail
   (fn [sent]
     (h/request-link! "new@x.com")
     (let [token (last (str/split (:link (first @sent)) #"/"))]
       (jdbc/execute! (db/datasource)
                      ["UPDATE login_tokens SET expires_at = now() - INTERVAL '1 hour' WHERE token_hash = ?"
                       (tokens/sha256-hex token)])
       (let [res (router/app (mock/request :get (str "/auth/" token)))]
         (is (= 404 (:status res))))))))
