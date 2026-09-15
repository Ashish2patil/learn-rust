#!/usr/bin/env bash
# Syntax-check every JS module in the project (they are ES modules, so feed via stdin).
set -u
fail=0
for f in $(find js -name '*.js' | sort); do
  if ! node --input-type=module --check < "$f" 2>/tmp/err; then
    echo "FAIL $f"; head -6 /tmp/err; fail=1
  fi
done
[ $fail -eq 0 ] && echo "All modules parse cleanly ✅"
exit $fail
