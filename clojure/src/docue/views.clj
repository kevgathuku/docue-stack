(ns docue.views
  (:require [clojure.string :as str]
            [hiccup2.core :as h]))

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

(defn notes-list [notes active-tag]
  (layout "My notes"
          [:h1 "My notes"]
          [:p [:a {:href "/notes/new"} "New note"]]
          (when active-tag
            [:p "Filtered by tag: " active-tag " " [:a {:href "/notes"} "clear"]])
          [:ul (for [{:keys [id title tags]} notes]
                 [:li [:a {:href (str "/notes/" id)} title]
                  (when (seq tags)
                    (str " [" (str/join ", " tags) "]"))])]))

(defn note-form
  ([action note] (note-form action note nil))
  ([action note error]
   (layout (if (:id note) "Edit note" "New note")
           [:h1 (if (:id note) "Edit note" "New note")]
           (when error [:p.error error])
           [:form {:method "post" :action action}
            [:label {:for "title"} "Title"]
            [:input {:type "text" :id "title" :name "title"
                      :value (:title note "")}]
            [:label {:for "content_md"} "Content (markdown)"]
            [:textarea {:id "content_md" :name "content_md"}
             (:content_md note "")]
            [:label {:for "tags"} "Tags (comma-separated)"]
            [:input {:type "text" :id "tags" :name "tags"
                      :value (str/join ", " (:tags note []))}]
            (when (:updated_at note)
              [:input {:type "hidden" :name "updated_at"
                        :value (str (:updated_at note))}])
            [:button {:type "submit"} "Save"]
            [:button {:type "submit" :formaction "/notes/preview"
                      :formtarget "_blank"} "Preview"]])))

(defn note-preview [html-body]
  (layout "Preview"
          [:h1 "Preview (not saved)"]
          [:div.note-body (h/raw html-body)]
          [:p [:a {:href "#" :onclick "window.close()"} "Close"]]))

(defn note-head [note]
  (list [:h1 (:title note)]
        (when (seq (:tags note))
          [:p.tags (str/join ", " (:tags note))])
        [:div.note-body (h/raw (:content_html note))]))

(defn note-view [note]
  (layout (:title note)
          (note-head note)
          [:h2 "Share"]
          (if (:share_token note)
            [:div
             [:p [:a {:href (str "/s/" (:share_token note))} "Share link"]]
             [:form {:method "post" :action (str "/notes/" (:id note) "/share")}
              [:button {:type "submit"} "Regenerate"]]
             [:form {:method "post" :action (str "/notes/" (:id note) "/unshare")}
              [:button {:type "submit"} "Revoke"]]]
            [:form {:method "post" :action (str "/notes/" (:id note) "/share")}
             [:button {:type "submit"} "Create share link"]])
          [:p [:a {:href (str "/notes/" (:id note) "/edit")} "Edit"]]
          [:form {:method "post" :action (str "/notes/" (:id note) "/delete")}
           [:button {:type "submit"} "Delete"]]))

(defn shared-note-view [note]
  (layout (:title note)
          (note-head note)))
