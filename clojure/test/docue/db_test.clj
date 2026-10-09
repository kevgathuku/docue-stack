(ns docue.db-test
  (:require [clojure.test :refer [deftest is testing]]
            [docue.db :as db]))

(deftest db-file-selection
  (testing "dev and unknown envs default to docue.db"
    (is (= "docue.db" (db/db-file "dev" nil)))
    (is (= "docue.db" (db/db-file "staging" nil))))

  (testing "test defaults to docue_test.db"
    (is (= "docue_test.db" (db/db-file "test" nil))))

  (testing "SQLITE_FILE overrides every env"
    (is (= "/data/prod.db" (db/db-file "prod" "/data/prod.db")))
    (is (= "/tmp/x.db" (db/db-file "dev" "/tmp/x.db"))))

  (testing "prod requires SQLITE_FILE and fails fast without it"
    (is (thrown? clojure.lang.ExceptionInfo
                 (db/db-file "prod" nil)))))

(deftest db-url-shape
  (testing "jdbc URL wraps the file with pragmatic pragmas"
    (is (= "jdbc:sqlite:docue_test.db?foreign_keys=on&journal_mode=WAL"
           (db/db-url "test" nil)))))
