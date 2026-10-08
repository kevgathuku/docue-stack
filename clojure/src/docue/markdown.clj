(ns docue.markdown
  (:import [com.vladsch.flexmark.ext.gfm.strikethrough StrikethroughExtension]
           [com.vladsch.flexmark.ext.tables TablesExtension]
           [com.vladsch.flexmark.html HtmlRenderer]
           [com.vladsch.flexmark.parser Parser]
           [com.vladsch.flexmark.util.data MutableDataSet]
           [org.owasp.html Sanitizers]))

(def ^:private options
  (doto (MutableDataSet.)
    (.set Parser/EXTENSIONS
          (java.util.ArrayList. [(TablesExtension/create)
                                 (StrikethroughExtension/create)]))))

(def ^:private parser (.build (Parser/builder options)))
(def ^:private renderer (.build (HtmlRenderer/builder options)))

(def ^:private policy
  (-> Sanitizers/BLOCKS
      (.and Sanitizers/FORMATTING)
      (.and Sanitizers/LINKS)
      (.and Sanitizers/TABLES)
      (.and Sanitizers/IMAGES)))

(defn render
  "Markdown source in, sanitized HTML out. Raw HTML in the source is
  stripped by the policy, so stored output is safe for anonymous readers."
  [md]
  (.sanitize policy (.render renderer (.parse parser md))))
