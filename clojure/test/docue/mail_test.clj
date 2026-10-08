(ns docue.mail-test
  (:require [clojure.test :refer [deftest is testing]]
            [docue.db :as db]
            [docue.mail :as mail]))

(deftest console-backend
  (testing "prints the recipient and link"
    (let [printed (atom nil)
          res (with-redefs [println (fn [s] (reset! printed s))]
                (mail/send-login-link! "a@b.c" "http://x/auth/abc"))]
      (is (re-find #"a@b\.c" @printed))
      (is (re-find #"http://x/auth/abc" @printed))
      (is (true? (:sent res))))))

(deftest prod-requires-smtp-config
  (testing "prod without SMTP config fails fast"
    (with-redefs [db/app-env (constantly "prod")]
      (is (thrown? clojure.lang.ExceptionInfo
                   (mail/send-login-link! "a@b.c" "http://x/auth/abc"))))))
