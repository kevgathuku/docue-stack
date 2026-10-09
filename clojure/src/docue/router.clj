(ns docue.router
  (:require [clojure.data.json :as json]
            [clojure.string :as str]
            [docue.db :as db]
            [docue.magic :as magic]
            [docue.markdown :as markdown]
            [docue.notes :as notes]
            [docue.users :as users]
            [docue.views :as views]
            [reitit.ring :as ring]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.content-type :refer [wrap-content-type]]
            [ring.middleware.resource :refer [wrap-resource]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]))

(defn- html [status body]
  {:status status
   :headers {"Content-Type" "text/html"}
   :body body})

(defn- preview-note! [{:keys [params]}]
  (html 200 (views/note-preview (markdown/render (get params "content_md" "")))))

(defn- not-found [_req]
  {:status 404
   :headers {"Content-Type" "text/html"}
   :body (views/not-found-page)})

(defn- logged-in? [req]
  (some? (-> req :session :user-id)))

(defn- require-login [handler]
  (fn [req]
    (if (logged-in? req)
      (handler req)
      {:status 302 :headers {"Location" "/login"} :body ""})))

(defn- request-link! [{:keys [params]}]
  (if (= :unknown-identifier (magic/request-link! (get params "identifier" "")))
    (html 422 (views/login-form "Enter your email to sign up, or your username to log in"))
    (html 200 (views/inbox-notice))))

(defn- signup! [{:keys [params]}]
  (let [username (str/trim (get params "username" ""))
        email (str/trim (get params "email" ""))
        form (fn [error] (views/signup-form {:username username :email email} error))]
    (cond
      (or (str/blank? username) (str/blank? email))
      (html 422 (form "Username and email are both required"))

      (not (magic/email-like? email))
      (html 422 (form "Enter a valid email address"))

      (users/find-by-username username)
      (html 422 (form "That username is already taken"))

      (users/find-by-email email)
      (html 422 (form "That email is already registered"))

      :else
      (do (users/create! username email)
          (magic/request-link! email)
          (html 200 (views/inbox-notice))))))

(defn- verify-link! [req]
  (if-let [user-id (magic/verify-link! (get-in req [:path-params :token]))]
    {:status 302
     :headers {"Location" "/notes"}
     :session {:user-id user-id}
     :body ""}
    (html 404 (views/bad-link))))

(defn- logout! [_req]
  {:status 302
   :headers {"Location" "/login"}
   :session nil
   :body ""})

(defn- owned-note [req]
  (notes/find-owned (get-in req [:path-params :id]) (-> req :session :user-id)))
(defn- share-note! [{:keys [session] :as req}]
  (let [id (get-in req [:path-params :id])]
    (if (and id (notes/mint-share-token! id (:user-id session)))
      {:status 302 :headers {"Location" (str "/notes/" id)} :body ""}
      (not-found req))))

(defn- unshare-note! [{:keys [session] :as req}]
  (let [id (get-in req [:path-params :id])]
    (if (and id (= :ok (notes/revoke-share-token! id (:user-id session))))
      {:status 302 :headers {"Location" (str "/notes/" id)} :body ""}
      (not-found req))))

(defn- show-shared-note [{:keys [path-params]}]
  (if-let [note (notes/find-by-share-token (:token path-params))]
    (html 200 (views/shared-note-view note))
    {:status 404
     :headers {"Content-Type" "text/html"}
     :body (views/not-found-page)}))


(defn- note-params [params]
  {:title (str/trim (get params "title" ""))
   :content-md (get params "content_md" "")
   :tags (notes/parse-tags (get params "tags" ""))})

(defn- create-note! [{:keys [params session]}]
  (let [owner-id (:user-id session)
        {:keys [title content-md tags]} (note-params params)]
    (if (str/blank? title)
      (html 422 (views/note-form "/notes" {:title title :content_md content-md :tags tags}
                                 "Title is required"))
      (let [res (notes/create! owner-id title content-md tags)]
        (if (map? res)
          (html 422 (views/note-form "/notes" {:title title :content_md content-md :tags tags}
                                     "A note with that title already exists"))
          {:status 302 :headers {"Location" (str "/notes/" res)} :body ""})))))

(defn- update-note! [{:keys [params session] :as req}]
  (let [owner-id (:user-id session)
        id (get-in req [:path-params :id])
{:keys [title content-md tags]} (note-params params)
        form (fn [error] (views/note-form (str "/notes/" (get-in req [:path-params :id]))
                                             {:id id :title title :content_md content-md :tags tags
                                              :updated_at (get params "updated_at")}
                                             error))]
    (cond
      (str/blank? title) (html 422 (form "Title is required"))
      :else (let [res (notes/update! id owner-id {:title title :content-md content-md
                                                  :tags tags :updated-at (get params "updated_at")})]
               (cond
                 (= :ok res) {:status 302 :headers {"Location" (str "/notes/" id)} :body ""}
                 (= :stale res) (html 409 (form "Changed elsewhere — reload and retry"))
                 (= :missing res) (not-found req)
                 :else (html 422 (form "A note with that title already exists")))))))

(defn- session-key []
  (let [secret (.getBytes ^String (or (System/getenv "SESSION_SECRET")
                                     (when (= "prod" (db/app-env))
                                       (throw (ex-info "SESSION_SECRET is required in prod" {})))
                                     "0123456789abcdef")
                                 "UTF-8")]
    (when (not= 16 (alength secret))
      (throw (ex-info "SESSION_SECRET must be 16 bytes" {})))
    secret))

(def app
  (-> (ring/ring-handler
       (ring/router
        [["/" {:get (fn [req]
                      {:status 302
                       :headers {"Location" (if (logged-in? req) "/notes" "/login")}
                       :body ""})}]
         ["/login" {:get (fn [_] (html 200 (views/login-form)))
                    :post request-link!}]
         ["/signup" {:get (fn [_] (html 200 (views/signup-form)))
                     :post signup!}]
         ["/auth/:token" {:get verify-link!}]
         ["/logout" {:post logout!}]
         ["/notes" {:get (require-login
                            (fn [req]
                              (let [tag (get-in req [:query-params "tag"])]
                                (html 200 (views/notes-list
                                            (notes/all-for-owner (-> req :session :user-id) tag)
                                            tag)))))
                    :post (require-login create-note!)}]
         ["/notes/new" {:get (require-login
                                (fn [_] (html 200 (views/note-form "/notes" {}))))}]
         ["/tags" {:get (require-login
                             (fn [req]
                               (html 200 (views/tags-list
                                         (notes/tag-counts (-> req :session :user-id))))))}]
         ["/notes/preview" {:post (require-login preview-note!)}]
         ["/notes/:id" {:get (require-login
                                (fn [req]
                                  (if-let [note (owned-note req)]
                                    (html 200 (views/note-view note))
                                    (not-found req))))
                         :post (require-login update-note!)}]
         ["/notes/:id/edit" {:get (require-login
                                     (fn [req]
                                       (if-let [note (owned-note req)]
                                         (html 200 (views/note-form (str "/notes/" (:id note)) note))
                                         (not-found req))))}]
         ["/notes/:id/delete" {:post (require-login
                                        (fn [req]
                                          (let [id (get-in req [:path-params :id])]
                                            (if (and id (= :ok (notes/delete! id (-> req :session :user-id))))
                                              {:status 302 :headers {"Location" "/notes"} :body ""}
                                              (not-found req)))))}]
         ["/notes/:id/share" {:post (require-login share-note!)}]
         ["/notes/:id/unshare" {:post (require-login unshare-note!)}]
         ["/s/:token" {:get show-shared-note}]
         ["/api/health"
          {:get (fn [_]
{:status 200
                   :headers {"Content-Type" "application/json"}
                   :body (json/write-str {:status "ok"
                                           :timestamp (str (java.time.Instant/now))
                                           :service "docue-api"})})}]]
       ;; Static segments win over :id (e.g. /notes/new); conflicts disabled.
       {:conflicts (constantly nil)})
       (ring/create-default-handler {:not-found not-found}))
      wrap-params
      (wrap-session {:store (cookie-store {:key (session-key)})
                     :cookie-name "docue-session"
                     :cookie-attrs {:http-only true :same-site :lax}})
      (wrap-resource "public")
      wrap-content-type))
