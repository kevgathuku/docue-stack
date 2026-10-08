(ns docue.notes-test
  (:require [clojure.test :refer [deftest is use-fixtures]]
            [docue.router :as router]
            [docue.test-helpers :as h]
            [ring.mock.request :as mock]))

(use-fixtures :once h/migrate-once)
(use-fixtures :each h/clean-db)

(defn note-form-post [cookie path params]
  (router/app (-> (h/form-post path params)
                  (mock/header "Cookie" cookie))))

(defn edit-page [cookie id]
  (h/authed-get (str "/notes/" id "/edit") cookie))

(defn updated-at-of [cookie id]
  (second (re-find #"name=\"updated_at\"[^>]*value=\"([^\"]+)\""
                   (:body (edit-page cookie id)))))

;; list

(deftest notes-list-anon
  (let [res (router/app (mock/request :get "/notes"))]
    (is (= 302 (:status res)))
    (is (= "/login" (get-in res [:headers "Location"])))))

(deftest notes-list-ownership
  (let [mine (h/login-cookie! "ada" "pw")]
    (h/create-user! "grace" "pw")
    (h/create-note! "ada" "Shopping" "milk" ["home" "errands"])
    (h/create-note! "grace" "Grace note" "x" [])
    (let [res (h/authed-get "/notes" mine)]
      (is (= 200 (:status res)))
      (is (re-find #"Shopping" (:body res)))
      (is (re-find #"home" (:body res)))
      (is (not (re-find #"Grace note" (:body res)))))))

(deftest notes-list-tag-filter
  (let [cookie (h/login-cookie! "ada" "pw")]
    (h/create-note! "ada" "One" "a" ["work"])
    (h/create-note! "ada" "Two" "b" ["home"])
    (let [res (h/authed-get "/notes?tag=work" cookie)]
      (is (= 200 (:status res)))
      (is (re-find #"One" (:body res)))
      (is (not (re-find #"Two" (:body res)))))))

;; create

(deftest note-create-form
  (let [cookie (h/login-cookie! "ada" "pw")
        res (h/authed-get "/notes/new" cookie)]
    (is (= 200 (:status res)))
    (is (re-find #"title" (:body res)))
    (is (re-find #"content" (:body res)))
    (is (re-find #"formaction=\"/notes/preview\"" (:body res)))))

(deftest note-create-persists-rendered-html
  (let [cookie (h/login-cookie! "ada" "pw")
        res (note-form-post cookie "/notes" {:title "Hello" :content_md "# Big" :tags "greet"})]
    (is (= 302 (:status res)))
    (let [view (h/authed-get (get-in res [:headers "Location"]) cookie)]
      (is (= 200 (:status view)))
      (is (re-find #"<h1>Big</h1>" (:body view)))
      (is (re-find #"greet" (:body view))))))

(deftest note-create-requires-title
  (let [cookie (h/login-cookie! "ada" "pw")
        res (note-form-post cookie "/notes" {:title "" :content_md "x" :tags ""})]
    (is (= 422 (:status res)))
    (is (re-find #"Title is required" (:body res)))))

(deftest note-create-duplicate-title
  (let [cookie (h/login-cookie! "ada" "pw")]
    (h/create-note! "ada" "Taken" "a" [])
    (let [res (note-form-post cookie "/notes" {:title "Taken" :content_md "b" :tags ""})]
      (is (= 422 (:status res)))
      (is (re-find #"already exists" (:body res))))))

(deftest note-create-sanitizes-html
  (let [cookie (h/login-cookie! "ada" "pw")
        res (note-form-post cookie "/notes" {:title "Xss" :content_md "<script>alert(1)</script>" :tags ""})]
    (is (= 302 (:status res)))
    (let [view (h/authed-get (get-in res [:headers "Location"]) cookie)]
      (is (not (re-find #"<script" (:body view)))))))

;; access

(deftest note-access-control
  (let [mine (h/login-cookie! "ada" "pw")]
    (h/create-user! "grace" "pw")
    (h/create-note! "grace" "Secret" "x" [])
    (let [path (str "/notes/" (h/note-id "Secret"))
          other (h/authed-get path mine)
          anon (router/app (mock/request :get path))]
      (is (= 404 (:status other)))
      (is (= 302 (:status anon)))
      (is (= "/login" (get-in anon [:headers "Location"]))))))

;; update

(deftest note-update-form-prefilled
  (let [cookie (h/login-cookie! "ada" "pw")]
    (h/create-note! "ada" "Draft" "body text" ["a"])
    (let [res (edit-page cookie (h/note-id "Draft"))]
      (is (= 200 (:status res)))
      (is (re-find #"Draft" (:body res)))
      (is (re-find #"body text" (:body res))))))

(deftest note-update-persists
  (let [cookie (h/login-cookie! "ada" "pw")]
    (h/create-note! "ada" "Draft" "old" [])
    (let [id (h/note-id "Draft")
          res (note-form-post cookie (str "/notes/" id)
                              {:title "Draft" :content_md "# New" :tags "b"
                               :updated_at (updated-at-of cookie id)})]
      (is (= 302 (:status res)))
      (let [view (h/authed-get (str "/notes/" id) cookie)]
        (is (re-find #"<h1>New</h1>" (:body view)))
        (is (re-find #"pill pill-\d\">b</span>" (:body view)))))))

(deftest note-update-conflict
  (let [cookie (h/login-cookie! "ada" "pw")]
    (h/create-note! "ada" "Draft" "old" [])
    (let [id (h/note-id "Draft")
          res (note-form-post cookie (str "/notes/" id)
                              {:title "Draft" :content_md "new" :tags ""
                               :updated_at "2000-01-01T00:00:00Z"})]
      (is (= 409 (:status res)))
      (is (re-find #"Changed elsewhere" (:body res))))))

(deftest note-update-forbidden
  (let [mine (h/login-cookie! "ada" "pw")]
    (h/create-user! "grace" "pw")
    (h/create-note! "grace" "Secret" "x" [])
    (let [id (h/note-id "Secret")
          res (note-form-post mine (str "/notes/" id)
                              {:title "Secret" :content_md "hijacked" :tags ""
                               :updated_at "2000-01-01T00:00:00Z"})]
      (is (= 404 (:status res))))))

;; delete

(deftest note-delete-owned
  (let [cookie (h/login-cookie! "ada" "pw")]
    (h/create-note! "ada" "Gone" "x" [])
    (let [id (h/note-id "Gone")
          res (router/app (-> (mock/request :post (str "/notes/" id "/delete"))
                              (mock/header "Cookie" cookie)))]
      (is (= 302 (:status res)))
      (is (= "/notes" (get-in res [:headers "Location"])))
      (is (= 404 (:status (h/authed-get (str "/notes/" id) cookie)))))))

(deftest note-delete-forbidden
  (let [mine (h/login-cookie! "ada" "pw")]
    (h/create-user! "grace" "pw")
    (h/create-note! "grace" "Secret" "x" [])
    (let [id (h/note-id "Secret")
          res (router/app (-> (mock/request :post (str "/notes/" id "/delete"))
                              (mock/header "Cookie" mine)))]
      (is (= 404 (:status res))))))

(deftest note-preview-anon
  (let [res (router/app (h/form-post "/notes/preview" {:content_md "# Hi"}))]
    (is (= 302 (:status res)))
    (is (= "/login" (get-in res [:headers "Location"])))))

(deftest note-preview-renders-without-persisting
  (let [cookie (h/login-cookie! "ada" "pw")
        res (note-form-post cookie "/notes/preview" {:content_md "# Hi **there**"})]
    (is (= 200 (:status res)))
    (is (re-find #"<h1>Hi <strong>there</strong></h1>" (:body res)))
    (let [list-res (h/authed-get "/notes" cookie)]
      (is (not (re-find #"Hi" (:body list-res)))))))

(deftest note-preview-sanitizes
  (let [cookie (h/login-cookie! "ada" "pw")
        res (note-form-post cookie "/notes/preview"
                            {:content_md "<script>alert(1)</script>"})]
    (is (= 200 (:status res)))
    (is (not (re-find #"<script" (:body res))))))
