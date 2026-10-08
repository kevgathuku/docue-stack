(ns docue.auth-test
  (:require [buddy.hashers :as hashers]
            [clojure.string :as str]
            [clojure.test :refer [deftest is testing use-fixtures]]
            [docue.db :as db]
            [docue.router :as router]
            [docue.users :as users]
            [next.jdbc :as jdbc]
            [ring.mock.request :as mock]))

(defn migrate-once [f]
  (db/migrate!)
  (f))

(defn clean-users [f]
  (when (not= "test" (db/app-env))
    (throw (ex-info "Refusing to wipe users outside the test env (run with APP_ENV=test)" {})))
  (jdbc/execute! (db/datasource) ["DELETE FROM users"])
  (f)
  (jdbc/execute! (db/datasource) ["DELETE FROM users"]))

(use-fixtures :once migrate-once)
(use-fixtures :each clean-users)

(defn create-user!
  ([username password]
   (create-user! username username password))
  ([username name password]
   (jdbc/execute! (db/datasource)
                  ["INSERT INTO users(username, name, password_hash) VALUES(?,?,?)"
                   username name (hashers/derive password)])))

(defn form-post [path params]
  (-> (mock/request :post path)
      (mock/content-type "application/x-www-form-urlencoded")
      (mock/body (->> params
                      (map (fn [[k v]] (str (name k) "=" v)))
                      (str/join "&")))))

(defn session-cookie [resp]
  (-> (get-in resp [:headers "Set-Cookie"])
      first
      (str/split #";")
      first
      str/trim))

(defn login! [username password]
  (router/app (form-post "/login" {:username username :password password})))

(defn authed-get [path cookie]
  (router/app (-> (mock/request :get path)
                  (mock/header "Cookie" cookie))))

(deftest login-page
  (testing "renders a login form"
    (let [res (router/app (mock/request :get "/login"))]
      (is (= 200 (:status res)))
      (is (re-find #"username" (:body res)))
      (is (re-find #"password" (:body res))))))

(deftest login-flow
  (testing "valid credentials start a session that gates /users"
    (create-user! "jsnow" "youKnowNothing")
    (let [login-res (login! "jsnow" "youKnowNothing")]
      (is (= 302 (:status login-res)))
      (is (= "/users" (get-in login-res [:headers "Location"])))
      (let [cookie (session-cookie login-res)
            users-res (authed-get "/users" cookie)]
        (is (= 200 (:status users-res)))
        (is (re-find #"jsnow" (:body users-res)))))))

(deftest login-rejection
  (testing "wrong password is rejected with an error"
    (create-user! "jsnow" "youKnowNothing")
    (let [res (login! "jsnow" "wrongPassword")]
      (is (= 401 (:status res)))
      (is (re-find #"Invalid username or password" (:body res)))))

  (testing "unknown user is rejected without revealing which field failed"
    (let [res (login! "nobody" "whatever")]
      (is (= 401 (:status res)))
      (is (re-find #"Invalid username or password" (:body res))))))

(deftest access-control
  (testing "anonymous users are redirected to login"
    (let [res (router/app (mock/request :get "/users"))]
      (is (= 302 (:status res)))
      (is (= "/login" (get-in res [:headers "Location"]))))))

(deftest logout-flow
  (testing "logout clears the session"
    (create-user! "jsnow" "youKnowNothing")
    (let [cookie (session-cookie (login! "jsnow" "youKnowNothing"))
          logout-res (router/app (-> (mock/request :post "/logout")
                                     (mock/header "Cookie" cookie)))]
      (is (= 302 (:status logout-res)))
      (is (= "/login" (get-in logout-res [:headers "Location"])))
      (let [after (router/app (-> (mock/request :get "/users")
                                 (mock/header "Cookie" (session-cookie logout-res))))]
        (is (= 302 (:status after)))
        (is (= "/login" (get-in after [:headers "Location"])))))))

(deftest root-redirect
  (testing "anonymous root goes to login"
    (let [res (router/app (mock/request :get "/"))]
      (is (= 302 (:status res)))
      (is (= "/login" (get-in res [:headers "Location"])))))

  (testing "logged-in root goes to users"
    (create-user! "jsnow" "youKnowNothing")
    (let [res (authed-get "/" (session-cookie (login! "jsnow" "youKnowNothing")))]
      (is (= 302 (:status res)))
      (is (= "/users" (get-in res [:headers "Location"]))))))

(deftest admin-seed-creates-when-empty
  (testing "creates the admin user when the database is empty"
    (users/ensure-admin! "s3cret")
    (let [admin (users/find-by-username "admin")]
      (is (some? admin))
      (is (= "Administrator" (:name admin))))))

(deftest admin-seed-skips-when-users-exist
  (testing "does nothing when users already exist"
    (create-user! "jsnow" "youKnowNothing")
    (users/ensure-admin! "s3cret")
    (is (nil? (users/find-by-username "admin")))))

(deftest admin-seed-skips-without-password
  (testing "does nothing without a password"
    (users/ensure-admin! nil)
    (is (nil? (users/find-by-username "admin")))))
