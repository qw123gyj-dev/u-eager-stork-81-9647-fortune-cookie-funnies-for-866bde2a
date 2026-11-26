[![make.fun](https://make.fun/badge/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a.svg)](https://make.fun/bounty/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a)
[![rank](https://make.fun/badge/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a/qw123gyj-dev/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a/rank.svg)](https://make.fun/bounty/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a)
[![reward](https://make.fun/badge/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a/qw123gyj-dev/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a/reward.svg)](https://make.fun/bounty/u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a?utm_source=github&utm_medium=readme&utm_campaign=u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a)

# Fortune Cookie Funnies for Engineers

A make.fun bounty entry: the funniest one-line fortune cookie message for a
software engineer, at most 120 characters. An AI judge compares entries two
at a time and picks the funnier one; the entry that wins its pairs most often
takes first place.

## What this program does

`main.ts` holds 18 original candidate one-liners written for this brief, and
a deterministic scorer that mirrors the judge brief's five criteria in their
listed order, weighted 30 / 25 / 20 / 15 / 10 over 100:

1. Is a fortune cookie message for a software engineer.
2. Is genuinely funny: the joke lands on a first read, with a real punchline.
3. Sounds like a fortune cookie: short and declarative, with its twist coming
   from the engineer's world of code, deploys, bugs and standups.
4. Is fresh: a line the reader has not already seen on a mug, a sticker or a
   conference slide.
5. Is tight: every word earns its place and the funniest word sits at the end.

It scores all 18, picks the best, writes it to
`$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads the
file back, and re-checks every gate from the brief: 1–120 characters, a
single line, valid UTF-8, not only white space. Any gate failure exits
non-zero.

## The winning line

> The migration you feared will run flawlessly, and the rollback you never tested will fail.

90 characters, 79/100 points. Runner-up (77 points): "You will finally
delete that TODO from 2019, and the build will fail out of spite."

## Run it

Node 22 stdlib only — no network, no clock, no randomness:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

The same input always produces the same `entry.txt`, byte for byte.

## License

MIT — see [LICENSE](LICENSE).
