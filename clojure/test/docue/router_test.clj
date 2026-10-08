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

(deftest unknown-routes
  (testing "unknown API and page paths both return the HTML 404"
    (doseq [path ["/api/hows-your-father" "/no-such-page"]]
      (let [res (router/app (mock/request :get path))]
        (is (= 404 (:status res)))
        (is (re-find #"text/html" (get-in res [:headers "Content-Type"])))
        (is (re-find #"Not Found" (:body res)))))))

(deftest stylesheet
  (testing "served as CSS and linked from pages"
    (let [css (router/app (mock/request :get "/style.css"))
          page (router/app (mock/request :get "/login"))]
      (is (= 200 (:status css)))
      (is (re-find #"text/css" (get-in css [:headers "Content-Type"])))
      (is (re-find #"style\.css" (:body page))))))

(deftest stylesheet-rules
  (testing "buttons signal interactivity and size consistently"
    (let [css (slurp (:body (router/app (mock/request :get "/style.css"))))]
      (is (re-find #"cursor:\s*pointer" css))
      (is (re-find #"\.btn\s*\{[^}]*display:\s*inline-block" css))
      (is (re-find #"\.btn\s*\{[^}]*text-decoration:\s*none" css)))))
