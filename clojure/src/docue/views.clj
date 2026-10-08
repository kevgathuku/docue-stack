(ns docue.views
  (:require [hiccup2.core :as h]))

(defn layout [title & content]
  (str (h/html [:html
                [:head [:meta {:charset "utf-8"}] [:title title]]
                [:body content]])))

(defn not-found-page []
  (layout "Not Found" [:h1 "Not Found"] [:p "No such page."]))
