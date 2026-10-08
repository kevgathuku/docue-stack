(ns docue.share-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [docue.router :as router]
            [docue.test-helpers :as h]
            [ring.mock.request :as mock]))

(use-fixtures :once h/migrate-once)
(use-fixtures :each h/clean-db)

(defn share! [cookie id]
  (router/app (-> (mock/request :post (str "/notes/" id "/share"))
                  (mock/header "Cookie" cookie))))

(defn shared-link [cookie id]
  (second (re-find #"(/s/[0-9a-f]{64})"
                   (:body (h/authed-get (str "/notes/" id) cookie)))))

(deftest share-mint-access
  (testing "owner mints a link; anonymous holder reads rendered note with no editor"
    (let [cookie (h/magic-cookie! "ada@x.com")]
      (h/create-note! "ada@x.com" "Shared" "# Hello" ["t"])
      (let [id (h/note-id "Shared")
            mint (share! cookie id)]
        (is (= 302 (:status mint)))
        (let [owner-view (:body (h/authed-get (str "/notes/" id) cookie))
              link (shared-link cookie id)
              res (router/app (mock/request :get link))]
          (is (some? link))
          (is (re-find #"http://localhost:8000/s/[0-9a-f]{64}" owner-view))
          (is (= 200 (:status res)))
          (is (re-find #"<h1>Hello</h1>" (:body res)))
          (is (not (re-find #"Edit" (:body res))))
          (is (not (re-find #"<form" (:body res)))))))))

(deftest share-guards
  (testing "non-owners cannot mint"
    (let [mine (h/magic-cookie! "ada@x.com")]
      (h/create-user! "grace" "grace@x.com")
      (h/create-note! "grace@x.com" "Secret" "x" [])
      (let [res (share! mine (h/note-id "Secret"))]
        (is (= 404 (:status res))))))

  (testing "random tokens 404"
    (let [res (router/app (mock/request :get "/s/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"))]
      (is (= 404 (:status res))))))

(deftest share-rotate
  (testing "regenerating replaces the token; the old one dies"
    (let [cookie (h/magic-cookie! "ada@x.com")]
      (h/create-note! "ada@x.com" "Shared" "# Hi" [])
      (let [id (h/note-id "Shared")]
        (share! cookie id)
        (let [old-link (shared-link cookie id)]
          (is (some? old-link))
          (share! cookie id)
          (let [new-link (shared-link cookie id)]
          (is (some? new-link))
          (is (not= old-link new-link))
          (is (= 404 (:status (router/app (mock/request :get old-link)))))
          (is (= 200 (:status (router/app (mock/request :get new-link)))))))))))

(deftest share-revoke
  (testing "revoking kills access indistinguishably from random tokens"
    (let [cookie (h/magic-cookie! "ada@x.com")]
      (h/create-note! "ada@x.com" "Shared" "# Hi" [])
      (let [id (h/note-id "Shared")]
        (share! cookie id)
        (let [link (shared-link cookie id)
              before (router/app (mock/request :get link))
              unshare (router/app (-> (mock/request :post (str "/notes/" id "/unshare"))
                                      (mock/header "Cookie" cookie)))
              after (router/app (mock/request :get link))
              random (router/app (mock/request :get "/s/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"))]
          (is (= 200 (:status before)))
          (is (= 302 (:status unshare)))
          (is (= 404 (:status after)))
          (is (= (:body after) (:body random)))
          (is (nil? (shared-link cookie id))))))))

(deftest share-revoke-forbidden
  (testing "non-owners cannot revoke"
    (let [mine (h/magic-cookie! "ada@x.com")]
      (h/create-user! "grace" "grace@x.com")
      (h/create-note! "grace@x.com" "Secret" "x" [])
      (let [res (router/app (-> (mock/request :post (str "/notes/" (h/note-id "Secret") "/unshare"))
                                (mock/header "Cookie" mine)))]
        (is (= 404 (:status res)))))))

(deftest share-route-write-protected
  (testing "writes under /s/ do not succeed"
    (let [cookie (h/magic-cookie! "ada@x.com")]
      (h/create-note! "ada@x.com" "Shared" "# Hi" [])
      (let [id (h/note-id "Shared")]
        (share! cookie id)
        (let [link (shared-link cookie id)
              res (router/app (-> (mock/request :post link)
                                  (mock/header "Cookie" cookie)))]
          (is (not= 200 (:status res)))
          (is (= 200 (:status (router/app (mock/request :get link))))))))))
