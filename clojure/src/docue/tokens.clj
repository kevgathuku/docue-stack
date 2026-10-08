(ns docue.tokens
  (:import [java.security MessageDigest SecureRandom]))

(defn random-hex
  "256-bit random value as 64 lowercase hex chars."
  []
  (let [bytes (byte-array 32)]
    (.nextBytes (SecureRandom.) bytes)
    (apply str (map #(format "%02x" (bit-and % 0xff)) bytes))))

(def alphabet "23456789abcdefghjkmnpqrstuvwxyz")

(defn short-id
  "Short unambiguous random id, e.g. note_k3j9x2. Not for secrets."
  [prefix]
  (let [n (count alphabet)]
    (str prefix "_"
         (apply str (repeatedly 12 #(nth alphabet (.nextInt (SecureRandom.) n)))))))

(defn sha256-hex [s]
  (let [digest (.digest (MessageDigest/getInstance "SHA-256")
                        (.getBytes ^String s "UTF-8"))]
    (apply str (map #(format "%02x" (bit-and % 0xff)) digest))))
