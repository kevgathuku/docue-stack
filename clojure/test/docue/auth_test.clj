(ns docue.auth-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [docue.router :as router]
            [docue.test-helpers :as h]
            [ring.mock.request :as mock]))

(use-fixtures :once h/migrate-once)
(use-fixtures :each h/clean-db)

(deftest login-page
  (testing "renders a login form"
    (let [res (router/app (mock/request :get "/login"))]
      (is (= 200 (:status res)))
      (is (re-find #"username" (:body res)))
      (is (re-find #"password" (:body res))))))

(deftest login-flow
  (testing "valid credentials start a session that gates /notes"
    (h/create-user! "jsnow" "youKnowNothing")
    (let [login-res (h/login! "jsnow" "youKnowNothing")]
      (is (= 302 (:status login-res)))
      (is (= "/notes" (get-in login-res [:headers "Location"])))
      (let [cookie (h/session-cookie login-res)
            notes-res (h/authed-get "/notes" cookie)]
        (is (= 200 (:status notes-res)))
        (is (re-find #"My notes" (:body notes-res)))))))

(deftest login-rejection
  (testing "wrong password is rejected with an error"
    (h/create-user! "jsnow" "youKnowNothing")
    (let [res (h/login! "jsnow" "wrongPassword")]
      (is (= 401 (:status res)))
      (is (re-find #"Invalid username or password" (:body res)))))

  (testing "unknown user is rejected without revealing which field failed"
    (let [res (h/login! "nobody" "whatever")]
      (is (= 401 (:status res)))
      (is (re-find #"Invalid username or password" (:body res))))))

(deftest access-control
  (testing "anonymous users are redirected to login"
    (let [res (router/app (mock/request :get "/notes"))]
      (is (= 302 (:status res)))
      (is (= "/login" (get-in res [:headers "Location"]))))))

(deftest logout-flow
  (testing "logout clears the session"
    (h/create-user! "jsnow" "youKnowNothing")
    (let [cookie (h/session-cookie (h/login! "jsnow" "youKnowNothing"))
          logout-res (router/app (-> (mock/request :post "/logout")
                                     (mock/header "Cookie" cookie)))]
      (is (= 302 (:status logout-res)))
      (is (= "/login" (get-in logout-res [:headers "Location"])))
      (let [after (router/app (-> (mock/request :get "/notes")
                                 (mock/header "Cookie" (h/session-cookie logout-res))))]
        (is (= 302 (:status after)))
        (is (= "/login" (get-in after [:headers "Location"])))))))

(deftest root-redirect
  (testing "anonymous root goes to login"
    (let [res (router/app (mock/request :get "/"))]
      (is (= 302 (:status res)))
      (is (= "/login" (get-in res [:headers "Location"])))))

  (testing "logged-in root goes to notes"
    (h/create-user! "jsnow" "youKnowNothing")
    (let [res (h/authed-get "/" (h/session-cookie (h/login! "jsnow" "youKnowNothing")))]
      (is (= 302 (:status res)))
      (is (= "/notes" (get-in res [:headers "Location"]))))))

(deftest users-page-removed
  (testing "the users list route is gone for everyone"
    (let [cookie (h/login-cookie! "ada" "pw")]
      (is (= 404 (:status (h/authed-get "/users" cookie))))
      (is (= 404 (:status (router/app (mock/request :get "/users"))))))))
