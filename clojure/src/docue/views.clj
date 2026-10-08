(ns docue.views
  (:require [hiccup2.core :as h]))

(defn layout [title & content]
  (str (h/html [:html
                [:head [:meta {:charset "utf-8"}] [:title title]]
                [:body content]])))

(defn not-found-page []
  (layout "Not Found" [:h1 "Not Found"] [:p "No such page."]))

(defn login-form
  ([] (login-form nil))
  ([error]
   (layout "Log in"
           [:h1 "Log in"]
           (when error [:p.error error])
           [:form {:method "post" :action "/login"}
            [:label {:for "username"} "Username"]
            [:input {:type "text" :id "username" :name "username"}]
            [:label {:for "password"} "Password"]
            [:input {:type "password" :id "password" :name "password"}]
            [:button {:type "submit"} "Log in"]])))

(defn users-list [users]
  (layout "Users"
          [:h1 "Users"]
          [:ul (for [{:keys [username name]} users]
                 [:li (str username " — " name)])]))
