(ns docue.notes
  (:require [clojure.data.json :as json]
            [clojure.string :as str]
            [docue.db :as db]
            [docue.markdown :as markdown]
            [docue.tokens :as tokens]
            [next.jdbc :as jdbc]))

(defn parse-tags [s]
  (->> (str/split (or s "") #",")
       (map str/trim)
       (remove str/blank?)
       vec))

(defn- with-tags [row]
  (update row :tags (fn [tags] (if tags (json/read-str tags) []))))

(defn all-for-owner
  [owner-id tag]
  (let [sql (if tag
              ["SELECT public_id AS id, title, tags, updated_at FROM notes WHERE owner_id = ? AND EXISTS(SELECT 1 FROM json_each(notes.tags) WHERE value = ?) ORDER BY updated_at DESC"
               owner-id tag]
              ["SELECT public_id AS id, title, tags, updated_at FROM notes WHERE owner_id = ? ORDER BY updated_at DESC"
               owner-id])]
    (map with-tags (jdbc/execute! (db/datasource) sql db/unqualified))))

(defn tag-counts [owner-id]
  (jdbc/execute! (db/datasource)
                 [(str "SELECT value AS tag, COUNT(*) AS n FROM notes, json_each(notes.tags)"
                       " WHERE owner_id = ? GROUP BY value ORDER BY n DESC, value")
                  owner-id]
                 db/unqualified))

(defn find-owned [public-id owner-id]
  (some-> (jdbc/execute-one!
           (db/datasource)
           [(str "SELECT public_id AS id, title, content_md, content_html, tags, share_token, updated_at"
                 " FROM notes WHERE public_id = ? AND owner_id = ?")
            public-id owner-id]
           db/unqualified)
          with-tags))

(defn- duplicate-title? [e]
  (and (instance? java.sql.SQLException e)
       (str/includes? (str (.getMessage ^java.sql.SQLException e)) "UNIQUE constraint failed")
       (not (str/includes? (str (.getMessage ^java.sql.SQLException e)) "notes.public_id"))))

(defn create! [owner-id title content-md tags]
  (try
    (:public_id (jdbc/execute-one!
                 (db/datasource)
                 [(str "INSERT INTO notes(title, content_md, content_html, tags, owner_id, public_id)"
                       " VALUES(?,?,?,?,?,?) RETURNING public_id")
                  title content-md (markdown/render content-md)
                  (json/write-str tags) owner-id (tokens/short-id "note")]
                 db/unqualified))
    (catch java.sql.SQLException e
      (if (duplicate-title? e) {:error :duplicate-title} (throw e)))))

(defn update! [public-id owner-id {:keys [title content-md tags updated-at]}]
  (try
    (let [n (:next.jdbc/update-count
             (jdbc/execute-one!
              (db/datasource)
              [(str "UPDATE notes SET title = ?, content_md = ?, content_html = ?,"
                    " tags = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')"
                    " WHERE public_id = ? AND owner_id = ? AND updated_at = ?")
               title content-md (markdown/render content-md)
               (json/write-str tags) public-id owner-id updated-at]))]
      (if (pos? n) :ok (if (find-owned public-id owner-id) :stale :missing)))
    (catch java.sql.SQLException e
      (if (duplicate-title? e) {:error :duplicate-title} (throw e)))))

(defn delete! [public-id owner-id]
  (let [n (:next.jdbc/update-count
           (jdbc/execute-one!
            (db/datasource)
            ["DELETE FROM notes WHERE public_id = ? AND owner_id = ?" public-id owner-id]))]
    (if (pos? n) :ok :missing)))

(defn mint-share-token!
  "Sets a fresh share token on an owned note. Returns the token, or nil
  when the note is not owned by the user."
  [public-id owner-id]
  (:share_token
   (jdbc/execute-one!
    (db/datasource)
    [(str "UPDATE notes SET share_token = ?"
          " WHERE public_id = ? AND owner_id = ? RETURNING share_token")
     (tokens/random-hex) public-id owner-id]
    db/unqualified)))

(defn revoke-share-token!
  "Clears the share token. Returns :ok, or :missing when not owned."
  [public-id owner-id]
  (if (:public_id (jdbc/execute-one!
                   (db/datasource)
                   ["UPDATE notes SET share_token = NULL WHERE public_id = ? AND owner_id = ? RETURNING public_id"
                    public-id owner-id]
                   db/unqualified))
    :ok
    :missing))

(defn find-by-share-token [token]
  (some-> (jdbc/execute-one!
           (db/datasource)
           [(str "SELECT id, title, content_html, tags"
                 " FROM notes WHERE share_token = ?")
            token]
           db/unqualified)
          with-tags))
