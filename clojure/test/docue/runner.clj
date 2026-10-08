(ns docue.runner
  (:require [clojure.test :as t]
            docue.auth-test
            docue.db-test
            docue.notes-test
            docue.router-test))

(defn -main [& _args]
  (let [{:keys [fail error]} (t/run-tests 'docue.auth-test 'docue.db-test 'docue.notes-test 'docue.router-test)]
    (System/exit (if (zero? (+ fail error)) 0 1))))
