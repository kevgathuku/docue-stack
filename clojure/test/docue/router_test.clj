(ns docue.router-test
  (:require [clojure.data.json :as json]
            [clojure.test :refer [deftest is testing]]
            [docue.router :as router]
            [ring.mock.request :as mock]))

(deftest health-check
  (testing "returns service status as JSON"
    (let [res (router/app (mock/request :get "/api/health"))
          body (json/read-str (:body res) :key-fn keyword)]
      (is (= 200 (:status res)))
      (is (= "ok" (:status body)))
      (is (= "docue-api" (:service body)))
      (is (string? (:timestamp body))))))

(deftest unknown-api-route
  (testing "unknown API paths return JSON 404s"
    (let [res (router/app (mock/request :get "/api/hows-your-father"))
          body (json/read-str (:body res) :key-fn keyword)]
      (is (= 404 (:status res)))
      (is (= "Not Found" (:error body))))))

(deftest unknown-page-route
  (testing "unknown pages return an HTML 404"
    (let [res (router/app (mock/request :get "/no-such-page"))]
      (is (= 404 (:status res)))
      (is (re-find #"text/html" (get-in res [:headers "Content-Type"])))
      (is (re-find #"Not Found" (:body res))))))
