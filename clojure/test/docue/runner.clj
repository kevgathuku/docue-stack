(ns docue.runner
  (:require [clojure.test :as t]
            docue.router-test))

(defn -main [& _args]
  (let [{:keys [fail error]} (t/run-tests 'docue.router-test)]
    (System/exit (if (zero? (+ fail error)) 0 1))))
