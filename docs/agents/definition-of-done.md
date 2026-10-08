# Definition of done (every task, every branch)

1. **TDD throughout.** Red → green in vertical slices at the agreed seam
   (HTTP boundary via ring-mock, unless a bead states otherwise). One seam,
   one test, one minimal implementation per cycle. No speculative code.
2. **Self-review before close.** Run the `code-review` skill against the
   branch (Standards + Spec axes) and fix every finding first. Refactoring
   belongs to this stage, not the TDD loop.
3. **Gates green:** full suite (`APP_ENV=test clojure -M:test -m docue.runner`
   or the stack-equivalent command), lint (`clj-kondo --lint src test`,
   zero warnings), format.
4. **Close only then.** Commit to the task branch, close the bead.
