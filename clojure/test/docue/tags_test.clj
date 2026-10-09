(ns docue.tags-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [docue.router :as router]
            [docue.test-helpers :as h]
            [ring.mock.request :as mock]))

(use-fixtures :once h/migrate-once)
(use-fixtures :each h/clean-db)

(deftest tags-anon
  (let [res (router/app (mock/request :get "/tags"))]
    (is (= 302 (:status res)))
    (is (= "/login" (get-in res [:headers "Location"])))))

(deftest tags-empty
  (let [cookie (h/magic-cookie! "ada@x.com")
        res (h/authed-get "/tags" cookie)]
    (is (= 200 (:status res)))
    (is (re-find #"No tags yet" (:body res)))))

(deftest tags-counts-and-links
  (let [cookie (h/magic-cookie! "ada@x.com")]
    (h/create-note! "ada@x.com" "One" "a" ["work" "home"])
    (h/create-note! "ada@x.com" "Two" "b" ["home"])
    (let [body (:body (h/authed-get "/tags" cookie))]
      (testing "every tag links to the filtered notes"
        (is (re-find #"href=\"/notes\?tag=home\"" body))
        (is (re-find #"href=\"/notes\?tag=work\"" body)))
      (testing "counts pair with their tag"
        (is (re-find #"home</a> <span class=\"count\">\(2\)</span>" body))
        (is (re-find #"work</a> <span class=\"count\">\(1\)</span>" body))))))

(deftest tags-ownership
  (let [mine (h/magic-cookie! "ada@x.com")]
    (h/create-user! "grace" "grace@x.com")
    (h/create-note! "ada@x.com" "Mine" "a" ["mine-tag"])
    (h/create-note! "grace@x.com" "Hers" "b" ["hers-tag"])
    (let [body (:body (h/authed-get "/tags" mine))]
      (is (re-find #"mine-tag" body))
      (is (not (re-find #"hers-tag" body))))))

(deftest tags-encoded-links
  (let [cookie (h/magic-cookie! "ada@x.com")]
    (h/create-note! "ada@x.com" "Spaced" "a" ["my tag"])
    (let [body (:body (h/authed-get "/tags" cookie))]
      (is (re-find #"href=\"/notes\?tag=my%20tag\"" body))
      (let [filtered (:body (h/authed-get "/notes?tag=my%20tag" cookie))]
        (is (re-find #"Spaced" filtered))))))

(deftest notes-list-links-to-tags
  (let [cookie (h/magic-cookie! "ada@x.com")
        body (:body (h/authed-get "/notes" cookie))]
    (is (re-find #"href=\"/tags\"" body))))

(deftest note-page-pills-link-to-filter
  (let [cookie (h/magic-cookie! "ada@x.com")]
    (h/create-note! "ada@x.com" "Tagged" "x" ["home"])
    (let [list-body (:body (h/authed-get "/notes" cookie))
          note-body (:body (h/authed-get (str "/notes/" (h/note-id "Tagged")) cookie))]
      (is (re-find #"href=\"/notes\?tag=home\"" list-body))
      (is (re-find #"href=\"/notes\?tag=home\"" note-body)))))

(deftest shared-page-pills-stay-plain
  (let [cookie (h/magic-cookie! "ada@x.com")]
    (h/create-note! "ada@x.com" "Shared" "x" ["home"])
    (let [id (h/note-id "Shared")]
      (router/app (-> (mock/request :post (str "/notes/" id "/share"))
                      (mock/header "Cookie" cookie)))
      (let [link (second (re-find #"(/s/[0-9a-f]{64})"
                                  (:body (h/authed-get (str "/notes/" id) cookie))))
            body (:body (router/app (mock/request :get link)))]
        (is (re-find #"home" body))
        (is (not (re-find #"href=\"/notes\?tag=" body)))))))
