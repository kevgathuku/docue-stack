(ns docue.notes
  (:require [clojure.string :as str]
            [docue.db :as db]
            [docue.markdown :as markdown]
            [next.jdbc :as jdbc]))

(defn parse-tags [s]
  (->> (str/split (or s "") #",")
       (map str/trim)
       (remove str/blank?)
       vec))

(defn- with-tags [row]
  (update row :tags (fn [tags] (if tags (vec (.getArray ^java.sql.Array tags)) []))))

(defn all-for-owner
  [owner-id tag]
   (let [sql (if tag
               ["SELECT id, title, tags, updated_at FROM notes WHERE owner_id = ? AND ? = ANY(tags) ORDER BY updated_at DESC"
                owner-id tag]
               ["SELECT id, title, tags, updated_at FROM notes WHERE owner_id = ? ORDER BY updated_at DESC"
                owner-id])]
     (map with-tags (jdbc/execute! (db/datasource) sql db/unqualified))))

(defn find-owned [id owner-id]
  (some-> (jdbc/execute-one!
             (db/datasource)
             [(str "SELECT id, title, content_md, content_html, tags, share_token, updated_at"
                   " FROM notes WHERE id = ? AND owner_id = ?")
              id owner-id]
             db/unqualified)
          with-tags))

(defn- duplicate? [e]
  (and (instance? org.postgresql.util.PSQLException e)
       (= "23505" (.getSQLState ^org.postgresql.util.PSQLException e))))

(defn create! [owner-id title content-md tags]
  (try
    (:id (jdbc/execute-one!
            (db/datasource)
            [(str "INSERT INTO notes(title, content_md, content_html, tags, owner_id)"
                  " VALUES(?,?,?,?,?) RETURNING id")
             title content-md (markdown/render content-md)
             (into-array String tags) owner-id]
            db/unqualified))
    (catch org.postgresql.util.PSQLException e
      (if (duplicate? e) {:error :duplicate-title} (throw e)))))

(defn update! [id owner-id {:keys [title content-md tags updated-at]}]
  (try
    (let [n (:next.jdbc/update-count
               (jdbc/execute-one!
                 (db/datasource)
                 [(str "UPDATE notes SET title = ?, content_md = ?, content_html = ?,"
                       " tags = ?, updated_at = now()"
                       " WHERE id = ? AND owner_id = ? AND updated_at = ?::timestamptz")
                  title content-md (markdown/render content-md)
                  (into-array String tags) id owner-id updated-at]))]
      (if (pos? n) :ok (if (find-owned id owner-id) :stale :missing)))
    (catch org.postgresql.util.PSQLException e
      (if (duplicate? e) {:error :duplicate-title} (throw e)))))

(defn delete! [id owner-id]
  (let [n (:next.jdbc/update-count
             (jdbc/execute-one!
               (db/datasource)
               ["DELETE FROM notes WHERE id = ? AND owner_id = ?" id owner-id]))]
    (if (pos? n) :ok :missing)))

(defn- random-token []
  (str/replace (str (random-uuid) (random-uuid)) "-" ""))

(defn mint-share-token!
  "Sets a fresh share token on an owned note. Returns the token, or nil
  when the note is not owned by the user."
  [id owner-id]
  (:share_token
   (jdbc/execute-one!
    (db/datasource)
    [(str "UPDATE notes SET share_token = ?"
          " WHERE id = ? AND owner_id = ? RETURNING share_token")
     (random-token) id owner-id]
    db/unqualified)))

(defn revoke-share-token!
  "Clears the share token. Returns :ok, or :missing when not owned."
  [id owner-id]
  (if (:id (jdbc/execute-one!
             (db/datasource)
             ["UPDATE notes SET share_token = NULL WHERE id = ? AND owner_id = ? RETURNING id"
              id owner-id]
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
