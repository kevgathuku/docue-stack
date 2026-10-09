(ns docue.views
  (:require [clojure.string :as str]
            [docue.db :as db]
            [hiccup2.core :as h]
            [ring.util.codec :as codec]))

(defn- topbar [logged-in?]
  [:header.topbar [:div.wrap
                  [:a.brand {:href "/"} "Docue"]
                  (when logged-in?
                    [:nav
                     [:a {:href "/notes"} "My notes"]
                     [:form.logout-form {:method "post" :action "/logout"}
                      [:button.btn.btn-ghost {:type "submit"} "Log out"]]])]])

(defn layout [title & content]
  (str (h/html [:html {:lang "en"}
                [:head
                 [:meta {:charset "utf-8"}]
                 [:meta {:name "viewport" :content "width=device-width, initial-scale=1"}]
                 [:title title]
                 [:link {:rel "stylesheet" :href "/style.css"}]]
                [:body
                 (topbar false)
                 [:main [:div.wrap content]]]])))

(defn app-layout [title & content]
  (str (h/html [:html {:lang "en"}
                [:head
                 [:meta {:charset "utf-8"}]
                 [:meta {:name "viewport" :content "width=device-width, initial-scale=1"}]
                 [:title title]
                 [:link {:rel "stylesheet" :href "/style.css"}]]
                [:body
                 (topbar true)
                 [:main [:div.wrap content]]]])))

(defn- pill-class [tag]
  (str "pill pill-" (mod (hash tag) 3)))

(defn- pills [tags]
  (when (seq tags)
    [:p (for [t tags] [:span {:class (pill-class t)} t])]))

(defn not-found-page []
  (layout "Not Found" [:h1 "Not Found"] [:p "No such page."]))

(defn login-form
  ([] (login-form nil))
  ([error]
   (layout "Log in"
           [:h1 "Log in"]
           (when error [:p.error error])
           [:form.form {:method "post" :action "/login"}
            [:label {:for "identifier"} "Email or username"]
            [:input {:type "text" :id "identifier" :name "identifier"}]
            [:div.form-row [:button.btn.btn-primary {:type "submit"} "Email me a login link"]]]
           [:p "No account? " [:a {:href "/signup"} "Sign up"]])))

(defn signup-form
  ([] (signup-form {} nil))
  ([values error]
   (layout "Sign up"
           [:h1 "Sign up"]
           (when error [:p.error error])
           [:form.form {:method "post" :action "/signup"}
            [:label {:for "username"} "Username"]
            [:input {:type "text" :id "username" :name "username"
                      :value (:username values "")}]
            [:label {:for "email"} "Email"]
            [:input {:type "email" :id "email" :name "email"
                      :value (:email values "")}]
            [:div.form-row [:button.btn.btn-primary {:type "submit"} "Create account"]]]
           [:p "Have an account? " [:a {:href "/login"} "Log in"]])))

(defn inbox-notice []
  (layout "Check your inbox"
          [:h1 "Check your inbox"]
          [:p "If that identifies an account, a login link is on its way. It expires in 15 minutes."]))

(defn bad-link []
  (layout "Link invalid"
          [:h1 "Link invalid or expired"]
          [:p [:a {:href "/login"} "Request a fresh link"]]))

(defn notes-list [notes active-tag]
  (app-layout "My notes"
          [:h1 "My notes"]
          [:p [:a.btn.btn-primary {:href "/notes/new"} "New note"]]
          [:p [:a {:href "/tags"} "Browse by tag"]]
          [:h2.section-label "Notes"]
          (when active-tag
            [:p "Filtered by tag: " active-tag " " [:a {:href "/notes"} "clear"]])
          [:ul.cards (for [{:keys [id title tags]} notes]
                       [:li.card [:a.title {:href (str "/notes/" id)} title]
                        (pills tags)])]))

(defn tags-list [tags]
  (app-layout "Tags"
          [:h1 "Tags"]
          (if (seq tags)
            [:ul.tags (for [{:keys [tag n]} tags]
                         [:li [:a {:href (str "/notes?tag=" (codec/url-encode tag))} tag]
                          " " [:span.count (str "(" n ")")]])]
            [:p "No tags yet."])))

(defn note-form
  ([action note] (note-form action note nil))
  ([action note error]
   (app-layout (if (:id note) "Edit note" "New note")
           [:h1 (if (:id note) "Edit note" "New note")]
           (when error [:p.error error])
           [:form.form {:method "post" :action action}
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
            [:div.form-row
             [:button.btn.btn-primary {:type "submit"} "Save"]
             [:button.btn.btn-ghost {:type "submit" :formaction "/notes/preview"
                                     :formtarget "_blank"} "Preview"]]])))

(defn note-preview [html-body]
  (layout "Preview"
          [:h1 "Preview (not saved)"]
          [:div.note-body (h/raw html-body)]
          [:p [:a {:href "#" :onclick "window.close()"} "Close"]]))

(defn note-head [note]
  (list [:h1 (:title note)]
        (pills (:tags note))
        [:div.note-body (h/raw (:content_html note))]))

(defn note-view [note]
  (app-layout (:title note)
          (note-head note)
          [:h2 "Share"]
          (if (:share_token note)
            [:section.share-box
             [:p [:code (str (db/base-url) "/s/" (:share_token note))]]
             [:div.form-row
              [:form {:method "post" :action (str "/notes/" (:id note) "/share")}
               [:button.btn.btn-ghost {:type "submit"} "Regenerate"]]
              [:form {:method "post" :action (str "/notes/" (:id note) "/unshare")}
               [:button.btn.btn-danger {:type "submit"} "Revoke"]]]]
            [:form {:method "post" :action (str "/notes/" (:id note) "/share")}
             [:button.btn.btn-primary {:type "submit"} "Create share link"]])
          [:div.form-row
           [:a.btn.btn-ghost {:href (str "/notes/" (:id note) "/edit")} "Edit"]
           [:form {:method "post" :action (str "/notes/" (:id note) "/delete")}
            [:button.btn.btn-danger {:type "submit"} "Delete"]]]))

(defn shared-note-view [note]
  (layout (:title note)
          (note-head note)))
