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
(is (re-find #"identifier" (:body res)))
      (is (re-find #"/signup" (:body res))))))

(deftest access-control
  (testing "anonymous users are redirected to login"
    (let [res (router/app (mock/request :get "/notes"))]
      (is (= 302 (:status res)))
      (is (= "/login" (get-in res [:headers "Location"]))))))

(deftest logout-flow
  (testing "logout clears the session"
    (let [cookie (h/magic-cookie! "jsnow@x.com")
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
    (let [res (h/authed-get "/" (h/magic-cookie! "jsnow@x.com"))]
      (is (= 302 (:status res)))
      (is (= "/notes" (get-in res [:headers "Location"]))))))

(deftest users-page-removed
  (testing "the users list route is gone for everyone"
    (let [cookie (h/magic-cookie! "ada@x.com")]
      (is (= 404 (:status (h/authed-get "/users" cookie))))
      (is (= 404 (:status (router/app (mock/request :get "/users"))))))))
