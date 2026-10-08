(ns docue.db-test
  (:require [clojure.test :refer [deftest is testing]]
            [docue.db :as db]))

(deftest db-url-selection
  (testing "dev uses DATABASE_URL, defaulting to localhost"
    (is (= "jdbc:postgresql://db:5432/devdb"
           (db/db-url "dev" "jdbc:postgresql://db:5432/devdb" nil)))
    (is (= "jdbc:postgresql://localhost:5432/docue"
           (db/db-url "dev" nil nil))))

  (testing "test uses TEST_DATABASE_URL, defaulting to localhost test db"
    (is (= "jdbc:postgresql://db:5432/testdb"
           (db/db-url "test" nil "jdbc:postgresql://db:5432/testdb")))
    (is (= "jdbc:postgresql://localhost:5432/docue_test"
           (db/db-url "test" nil nil))))

  (testing "prod requires DATABASE_URL and fails fast without it"
    (is (= "jdbc:postgresql://db:5432/proddb"
           (db/db-url "prod" "jdbc:postgresql://db:5432/proddb" nil)))
    (is (thrown? clojure.lang.ExceptionInfo
                 (db/db-url "prod" nil nil))))

  (testing "unknown envs fall back to dev behavior"
    (is (= "jdbc:postgresql://localhost:5432/docue"
           (db/db-url "staging" nil nil)))))
