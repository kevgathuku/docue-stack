(ns docue.router
  (:require [buddy.hashers :as hashers]
            [clojure.data.json :as json]
            [clojure.string :as str]
            [docue.db :as db]
            [docue.users :as users]
            [docue.views :as views]
            [reitit.ring :as ring]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.middleware.session.cookie :refer [cookie-store]]))

(defn- json-resp [status body]
  {:status status
   :headers {"Content-Type" "application/json"}
   :body (json/write-str body)})

(defn- not-found [{:keys [uri]}]
  (if (str/starts-with? uri "/api")
    (json-resp 404 {:error "Not Found"})
    {:status 404
     :headers {"Content-Type" "text/html"}
     :body (views/not-found-page)}))

(defn- logged-in? [req]
  (some? (-> req :session :user-id)))

(defn- require-login [handler]
  (fn [req]
    (if (logged-in? req)
      (handler req)
      {:status 302 :headers {"Location" "/login"} :body ""})))

(defn- login! [{:keys [params]}]
  (let [{:strs [username password]} params
        user (when (and username password) (users/find-by-username username))]
    (if (and user (hashers/check password (:password_hash user)))
      {:status 302
       :headers {"Location" "/users"}
       :session {:user-id (:id user)}
       :body ""}
      {:status 401
       :headers {"Content-Type" "text/html"}
       :body (views/login-form "Invalid username or password")})))

(defn- logout! [_req]
  {:status 302
   :headers {"Location" "/login"}
   :session nil
   :body ""})

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
                       :headers {"Location" (if (logged-in? req) "/users" "/login")}
                       :body ""})}]
         ["/login" {:get (fn [_] {:status 200
                                  :headers {"Content-Type" "text/html"}
                                  :body (views/login-form)})
                    :post login!}]
         ["/logout" {:post logout!}]
         ["/users" {:get (require-login
                          (fn [_] {:status 200
                                   :headers {"Content-Type" "text/html"}
                                   :body (views/users-list (users/all))}))}]
         ["/api/health"
          {:get (fn [_]
                  (json-resp 200 {:status "ok"
                                  :timestamp (str (java.time.Instant/now))
                                  :service "docue-api"}))}]])
       (ring/create-default-handler {:not-found not-found}))
      wrap-params
      (wrap-session {:store (cookie-store {:key (session-key)})
                     :cookie-name "docue-session"
                     :cookie-attrs {:http-only true :same-site :lax}})))
