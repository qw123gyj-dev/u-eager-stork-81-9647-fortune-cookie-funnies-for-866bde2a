// Fortune Cookie Funnies for Engineers
// make.fun bounty: u-eager-stork-81-9647-fortune-cookie-funnies-for-866bde2a
// Prize: $2, 1st place. Deadline: 2026-11-26T14:50:00Z.
//
// The task: write the funniest one-line fortune cookie message for a software
// engineer, at most 120 characters. An AI judge compares entries two at a
// time and picks the funnier one; the entry that wins its pairs most often
// takes first place.
//
// The gate (sealed scorer): /output/entry.txt must be UTF-8 text of 1 to 120
// characters, not only white space, a single line. Only a valid entry goes
// before the judge.
//
// The judge weighs the entries on these criteria, most important first:
//   1. Is a fortune cookie message for a software engineer, not a general
//      slogan or a joke about something else.
//   2. Is genuinely funny: the joke lands on a first read, with a real
//      punchline rather than a pun that only half works.
//   3. Sounds like a fortune cookie: short and declarative, with its twist
//      coming from the engineer's world of code, deploys, bugs and standups.
//   4. Is fresh: a line the reader has not already seen on a mug, a sticker
//      or a conference slide.
//   5. Is tight: every word earns its place and the funniest word sits at
//      the end.
//
// This program mirrors that brief with a deterministic scorer, in the brief's
// own order, weighted 30 / 25 / 20 / 15 / 10 over 100. It scores 18 original
// candidate one-liners written for this brief in this session, picks the best,
// writes it to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt),
// reads the file back, and re-checks every gate from the brief. Any gate
// failure exits non-zero.
//
// Node 22 stdlib only. No network, no clock, no randomness: the same input
// always produces the same entry.txt, byte for byte.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Constants from the brief
// ---------------------------------------------------------------------------

/** The gate: entry.txt is UTF-8 text of 1 to 120 characters. */
const MAX_CHARS = 120;
const MIN_CHARS = 1;

/** Scorer weights, in the judge brief's own order. Heaviest first. */
const WEIGHTS = {
  fortuneForEngineer: 30, // criterion 1
  funnyFirstRead: 25, // criterion 2
  soundsLikeFortune: 20, // criterion 3
  fresh: 15, // criterion 4
  tight: 10, // criterion 5
} as const;

const TOTAL_WEIGHT =
  WEIGHTS.fortuneForEngineer +
  WEIGHTS.funnyFirstRead +
  WEIGHTS.soundsLikeFortune +
  WEIGHTS.fresh +
  WEIGHTS.tight; // 100

// ---------------------------------------------------------------------------
// The 18 candidates
// ---------------------------------------------------------------------------
//
// Every line below was written fresh in this session for this brief. Each one
// is a single declarative sentence in the voice of a fortune cookie, aimed at
// a software engineer, with its twist drawn from the engineer's own world:
// code review, deploys, bugs, standups, estimates, legacy code, migrations,
// config files, cloud bills, TODOs, tickets. The `mechanism` note records
// what the joke is doing, so a reader can see why the scorer credits it;
// the scorer itself reads only `text`.
//
// Freshness rule applied while writing: no stock line from a mug, a sticker
// or a conference slide. That means no "it works on my machine", no "have you
// tried turning it off and on again", no "there are only 10 types of people",
// no "it is not a bug, it is a feature", no missing-semicolon gag, no Friday
// deploy cliché. Where a familiar trope is used at all (the rubber duck, the
// intern, the two-day estimate), the twist on it is new.

interface Candidate {
  id: number;
  text: string;
  mechanism: string;
}

const CANDIDATES: Candidate[] = [
  {
    id: 1,
    text: "Your pull request will be approved in seconds by the one teammate who never reads code.",
    mechanism:
      "Incongruity: the fastest approval comes from the least attention. The approval ritual is inverted.",
  },
  {
    id: 2,
    text: "The bug you chased for three days will be fixed in ten minutes by the new intern.",
    mechanism:
      "Status reversal with concrete numbers: three days of senior effort loses to ten minutes of a newcomer.",
  },
  {
    id: 3,
    text: "Your two-day estimate will become two weeks, and the whole meeting will act surprised.",
    mechanism:
      "Every engineer recognises the estimate slip; the joke is that the room pretends it is news.",
  },
  {
    id: 4,
    text: "The legacy code you mocked yesterday is the code you will maintain tomorrow.",
    mechanism:
      "Karmic reversal: the mocker inherits the mocked thing. Short, declarative, fortune-shaped.",
  },
  {
    id: 5,
    text: "A meeting that could have been an email will eat your afternoon and come back for seconds.",
    mechanism:
      "The meeting is personified as a hungry guest; 'seconds' lands the food metaphor at the end.",
  },
  {
    id: 6,
    text: "You will spend six hours debugging a typo in a config file you did not write.",
    mechanism:
      "Effort disproportion: six hours against one typo, sharpened by the fact that the file is not even yours.",
  },
  {
    id: 7,
    text: "Your standup update will be 'same as yesterday' for the fifth day in a row.",
    mechanism:
      "The standup ritual itself is the joke: the daily ceremony reports nothing, five days running.",
  },
  {
    id: 8,
    text: "The migration you feared will run flawlessly, and the rollback you never tested will fail.",
    mechanism:
      "The feared thing succeeds and the safety net fails: the worry was aimed at the wrong half.",
  },
  {
    id: 9,
    text: "You will write a comment explaining the code, then delete the code and keep the comment.",
    mechanism:
      "Absurd preservation: the explanation outlives the thing it explains. The code is the disposable part.",
  },
  {
    id: 10,
    text: "This month's cloud bill will teach you exactly what 'serverless' really costs.",
    mechanism:
      "The marketing word meets the invoice: 'serverless' turns out to mean 'priced by the surprise'.",
  },
  {
    id: 11,
    text: "Your rubber duck is tired of listening and has filed a formal complaint.",
    mechanism:
      "The debugging prop gains a voice and a grievance; the listener files against the talker.",
  },
  {
    id: 12,
    text: "Someone will ask if the site is down. You will already know, because you broke it.",
    mechanism:
      "Two beats: the innocent question, then the confession. The punchline is the engineer's own guilt.",
  },
  {
    id: 13,
    text: "The hotfix you push at midnight will fix the bug and break the login page.",
    mechanism:
      "Conservation of breakage: fixing one thing breaks another, at the worst hour, in the worst place.",
  },
  {
    id: 14,
    text: "You will finally delete that TODO from 2019, and the build will fail out of spite.",
    mechanism:
      "The build is personified as petty: deleting a seven-year-old TODO is punished on purpose.",
  },
  {
    id: 15,
    text: "Your code will pass every test except the one your biggest customer runs first.",
    mechanism:
      "Murphy's law aimed at the test suite: the single untested path is the one that matters most.",
  },
  {
    id: 16,
    text: "The feature you shipped today will be deprecated before your coffee gets cold.",
    mechanism:
      "Speed of obsolescence measured in coffee: shipped and dead inside one cup.",
  },
  {
    id: 17,
    text: "A user will report a bug you cannot reproduce, then close the ticket as user error.",
    mechanism:
      "The reporter becomes the judge: the user files the bug and acquits the software, blaming you.",
  },
  {
    id: 18,
    text: "You will cause a production incident during the only demo your boss ever gives.",
    mechanism:
      "Worst timing, maximal audience: the one demo that counts is the one that breaks.",
  },
];

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------
//
// These tables are the scorer's knowledge of the brief's world. They are
// deliberately small and explicit: every entry is a judgement call about
// what counts as the engineer's world, a fortune-cookie voice, a stock joke,
// or a punchline word. Nothing here is read from disk or the network.

// Words and phrases that mark a line as belonging to the engineer's world.
// Weighted: a line with several distinct domain terms is unmistakably about
// a software engineer; a line with none is a general slogan.
const ENGINEER_TERMS: Array<{ term: string; weight: number }> = [
  { term: "pull request", weight: 3 },
  { term: "standup", weight: 3 },
  { term: "hotfix", weight: 3 },
  { term: "migration", weight: 3 },
  { term: "rollback", weight: 3 },
  { term: "todo", weight: 3 },
  { term: "rubber duck", weight: 3 },
  { term: "config file", weight: 3 },
  { term: "cloud bill", weight: 3 },
  { term: "serverless", weight: 3 },
  { term: "production incident", weight: 3 },
  { term: "legacy code", weight: 3 },
  { term: "debugging", weight: 2 },
  { term: "deploy", weight: 2 },
  { term: "bug", weight: 2 },
  { term: "code", weight: 2 },
  { term: "build", weight: 2 },
  { term: "test", weight: 2 },
  { term: "ticket", weight: 2 },
  { term: "site is down", weight: 2 },
  { term: "login page", weight: 2 },
  { term: "estimate", weight: 2 },
  { term: "meeting", weight: 2 },
  { term: "intern", weight: 2 },
  { term: "teammate", weight: 1 },
  { term: "demo", weight: 1 },
  { term: "feature", weight: 1 },
  { term: "deprecated", weight: 1 },
  { term: "comment", weight: 1 },
  { term: "user", weight: 1 },
  { term: "customer", weight: 1 },
  { term: "boss", weight: 1 },
];

// Openings and verb shapes that mark a line as a fortune cookie: a prediction
// addressed to "you", in the future tense, declarative rather than a question.
const FORTUNE_OPENINGS: string[] = [
  "your ",
  "you will",
  "a user will",
  "someone will",
  "the ",
  "this ",
  "a meeting",
];

const FUTURE_MARKERS: string[] = [" will ", " will be ", " is going to "];

// Words that turn a setup into a punchline: contrast, reversal, exception,
// or a second beat that undercuts the first.
const TWIST_CONNECTORS: string[] = [
  " but ",
  " except ",
  ", and ",
  " then ",
  " because ",
  ". you ",
  " will fail",
  " out of spite",
];

// Concrete numbers and time spans make a joke land on a first read: the
// reader can picture "three days" against "ten minutes" without decoding.
// Ordinals count too: "the fifth day in a row" and "runs first" are concrete.
const CONCRETE_NUMBER = /\b(three|six|ten|five|two|2019|first|second|third|fifth|tenth|seconds|minutes|hours|days|weeks|months)\b/gi;

// Pairs of opposed words whose co-presence is a reversal joke: the same
// thing is mocked and then inherited, deleted and then kept, shipped and
// then deprecated, fixed and then broken. The reversal IS the punchline.
const REVERSAL_PAIRS: Array<[string, string]> = [
  ["mocked", "maintain"],
  ["delete", "keep"],
  ["shipped", "deprecated"],
  ["fix", "break"],
  ["chased", "fixed"],
];

// Number words, for the "two magnitudes" contrast: three days of senior
// effort against ten minutes of a newcomer.
const NUMBER_WORDS = ["three", "six", "ten", "five", "two", "2019", "first", "second", "third", "fifth", "tenth"];

// Stock lines and tropes that live on mugs, stickers and conference slides.
// Criterion 4 docks a line that leans on one of these. A full stock phrase
// costs more than a familiar trope with a fresh twist on it.
const STOCK_PHRASES: Array<{ phrase: string; penalty: number }> = [
  { phrase: "works on my machine", penalty: 12 },
  { phrase: "turn it off and on again", penalty: 12 },
  { phrase: "turning it off and on again", penalty: 12 },
  { phrase: "10 types of people", penalty: 12 },
  { phrase: "ten types of people", penalty: 12 },
  { phrase: "not a bug", penalty: 12 },
  { phrase: "it is a feature", penalty: 12 },
  { phrase: "it’s a feature", penalty: 12 },
  { phrase: "missing semicolon", penalty: 10 },
  { phrase: "semicolon", penalty: 8 },
  { phrase: "friday deploy", penalty: 8 },
  { phrase: "deploys on friday", penalty: 8 },
  { phrase: "naming things", penalty: 8 },
  { phrase: "cache invalidation", penalty: 8 },
  { phrase: "real programmers", penalty: 8 },
  { phrase: "works in dev", penalty: 8 },
  { phrase: "works in development", penalty: 8 },
];

// Familiar tropes that are not stock phrases on their own, but that a judge
// who has read every fortune cookie will recognise. A fresh twist on one
// (the duck files a complaint, the TODO is punished) earns most of the
// freshness back; a bare reuse does not.
const FAMILIAR_TROPES: string[] = [
  "rubber duck",
  "friday",
  "estimate",
  "intern",
  "legacy code",
  "standup",
  "todo",
];

// Words that signal a genuinely fresh pairing: an inanimate or abstract
// thing behaving with intent, or a reversal of who acts on whom.
const FRESHNESS_SIGNALS: string[] = [
  "filed a formal complaint",
  "fail out of spite",
  "keep the comment",
  "act surprised",
  "come back for seconds",
  "never reads code",
  "you did not write",
  "you cannot reproduce",
  "you broke it",
  "only demo",
  "before your coffee gets cold",
  "never tested",
];

// Words that do no work in a one-liner. Each one found costs tightness.
const FILLER_WORDS: string[] = [
  "really",
  "very",
  "just",
  "actually",
  "quite",
  "basically",
  "literally",
  "totally",
  "simply",
];

// Words that make a strong ending: the funniest word should sit at the end,
// so a line that closes on one of these earns its tightness points.
const STRONG_ENDINGS: string[] = [
  "code",
  "intern",
  "surprised",
  "tomorrow",
  "seconds",
  "write",
  "row",
  "fail",
  "comment",
  "costs",
  "complaint",
  "it",
  "page",
  "spite",
  "first",
  "cold",
  "error",
  "gives",
];

// Weak words to end on: the punchline has already happened and the line
// trails off after it.
const WEAK_ENDINGS: string[] = [
  "now",
  "today",
  "again",
  "there",
  "then",
  "away",
  "off",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Character count in code points, matching the gate's "characters". */
function charCount(text: string): number {
  return [...text].length;
}

/** Lower-cased text with punctuation kept, for lexicon matching. */
function lower(text: string): string {
  return text.toLowerCase();
}

/** Words of a line, split on whitespace, punctuation stripped at the edges. */
function wordsOf(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-z0-9'’]+|[^a-z0-9'’]+$/gi, ""))
    .filter((w) => w.length > 0);
}

/** Count occurrences of a (possibly multi-word) term, case-insensitively.
 * Single-word terms match on whole words, with inflections allowed
 * ("test" matches "tested" and "tests"), so "bug" does not match inside
 * "debugging" (that double-counted one concept as two domain terms) and
 * "fix" does not match inside "hotfix", while "tested" still counts as
 * testing. Multi-word phrases match as substrings, which is safe for them. */
function countTerm(text: string, term: string): number {
  const hay = lower(text);
  const needle = term.toLowerCase();
  if (!needle.includes(" ")) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (hay.match(new RegExp(`\\b${escaped}\\w*\\b`, "g")) ?? []).length;
  }
  let count = 0;
  let at = 0;
  while (true) {
    const found = hay.indexOf(needle, at);
    if (found === -1) break;
    count += 1;
    at = found + needle.length;
  }
  return count;
}

/** True when the line contains any of the given phrases. */
function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => countTerm(text, p) > 0);
}

/**
 * Split a line into clauses on sentence breaks and on ", " / " and " joins.
 * Commas inside numbers (1,000) and decimals (99.9) are protected first, so a
 * number is never chopped in half; a short trailing fragment such as a
 * countdown is rejoined to the clause before it. Our candidates carry no
 * comma-numbers, but the splitter is written to survive them.
 */
function splitClauses(text: string): string[] {
  const protectedText = text
    .replace(/(\d),(\d)/g, "$1\u0001$2")
    .replace(/(\d)\.(\d)/g, "$1\u0002$2");
  const raw = protectedText.split(/(?<=[.!?])\s+|,\s+|\s+and\s+/);
  const clauses = raw
    .map((c) => c.replace(/\u0001/g, ",").replace(/\u0002/g, ".").trim())
    .filter((c) => c.length > 0);
  // Rejoin a short trailing fragment (a countdown, a tag) to the clause
  // before it: it is a tail, not a clause of its own.
  const merged: string[] = [];
  for (const clause of clauses) {
    if (merged.length > 0 && wordsOf(clause).length <= 2) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${clause}`;
    } else {
      merged.push(clause);
    }
  }
  return merged;
}

/** The last word of a line, lower-cased, punctuation stripped. */
function lastWord(text: string): string {
  const words = wordsOf(text);
  return words.length > 0 ? words[words.length - 1].toLowerCase() : "";
}

/** Clamp a number into [lo, hi]. */
function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

// ---------------------------------------------------------------------------
// The scorer: the judge brief's five criteria, in the brief's own order
// ---------------------------------------------------------------------------

interface CriterionScore {
  name: string;
  points: number;
  max: number;
  reasons: string[];
}

interface ScoredCandidate {
  candidate: Candidate;
  criteria: CriterionScore[];
  total: number;
  chars: number;
  words: number;
}

/**
 * Criterion 1 (30 pts): is a fortune cookie message for a software engineer.
 *
 * A fortune cookie message is a prediction addressed to the reader, in the
 * future tense, about their life. A fortune cookie message FOR A SOFTWARE
 * ENGINEER additionally lives in the engineer's world. Both halves are
 * scored: the fortune shape (opening + future tense + second person) and the
 * engineer content (distinct domain terms). A line with no engineer terms
 * scores low even if it is fortune-shaped, because criterion 1 says such a
 * line loses to any fortune cookie message for a software engineer.
 */
function scoreFortuneForEngineer(text: string): CriterionScore {
  const reasons: string[] = [];
  let points = 0;
  const low = lower(text);

  // Fortune shape: up to 12 points.
  let shape = 0;
  const startsFortune = FORTUNE_OPENINGS.some((o) => low.startsWith(o));
  if (startsFortune) {
    shape += 5;
    reasons.push("opens as a fortune-cookie prediction");
  }
  if (containsAny(text, FUTURE_MARKERS)) {
    shape += 4;
    reasons.push("future tense ('will')");
  }
  if (/\byou\b|\byour\b/.test(low)) {
    shape += 3;
    reasons.push("addressed to the reader");
  }
  points += shape;

  // Engineer content: up to 18 points, by distinct weighted domain terms.
  let domain = 0;
  const seenTerms: string[] = [];
  for (const { term, weight } of ENGINEER_TERMS) {
    if (countTerm(text, term) > 0) {
      domain += weight;
      seenTerms.push(term);
    }
  }
  domain = Math.min(18, domain);
  points += domain;
  if (seenTerms.length > 0) {
    reasons.push(`engineer terms: ${seenTerms.join(", ")}`);
  } else {
    reasons.push("no engineer-world terms: reads as a general slogan");
  }

  return { name: "fortune for engineer", points, max: WEIGHTS.fortuneForEngineer, reasons };
}

/**
 * Criterion 2 (25 pts): genuinely funny, lands on a first read, real punchline.
 *
 * A joke that lands on a first read has a visible mechanism: a setup, then a
 * twist connector, then a payoff that reverses the expectation. Concrete
 * numbers help the reader picture it instantly. A line with no twist
 * connector and no reversal is a statement, not a joke, however true it is.
 * A pun that only half works would show up here as a twist with no payoff
 * word; we credit payoff words that name the reversal.
 */
function scoreFunnyFirstRead(text: string): CriterionScore {
  const reasons: string[] = [];
  let points = 0;
  const low = lower(text);
  const clauses = splitClauses(text);

  // Twist structure: up to 12 points.
  const twistHits = TWIST_CONNECTORS.filter((c) => low.includes(c));
  let twistPoints = 0;
  if (twistHits.length > 0) {
    twistPoints = Math.min(12, 6 + 3 * twistHits.length);
    reasons.push(`twist via ${twistHits.map((t) => `'${t.trim()}'`).join(", ")}`);
  } else if (splitClauses(text).length >= 2 && /\sand\s/.test(low.replace(/,\s+and\s+/g, " "))) {
    // A bare " and " joining two clauses is a twist join too: the second
    // clause undercuts the first ("fix the bug and break the login page").
    // The comma form ", and " was already credited above; only the bare form
    // reaches this branch, so no line is credited twice for one join.
    twistPoints = 6;
    reasons.push("twist via bare 'and' join");
  } else {
    reasons.push("no twist connector: reads as a flat statement");
  }
  points += twistPoints;

  // Multi-beat structure: a second clause that undercuts the first.
  if (clauses.length >= 2) {
    points += 4;
    reasons.push(`${clauses.length} beats: setup then payoff`);
  }

  // Concrete numbers make the picture instant: up to 5 points.
  const numbers = text.match(CONCRETE_NUMBER) ?? [];
  if (numbers.length > 0) {
    points += Math.min(5, 2 * numbers.length);
    reasons.push(`concrete numbers/times: ${[...new Set(numbers.map((n) => n.toLowerCase()))].join(", ")}`);
  }

  // Payoff words: the reversal is named, not implied. Up to 4 points.
  const payoffWords = [
    "never",
    "spite",
    "surprised",
    "complaint",
    "broke it",
    "user error",
    "seconds",
    "except",
    "already",
    "did not write",
    "only",
  ];
  const payoffHits = payoffWords.filter((w) => countTerm(text, w) > 0);
  if (payoffHits.length > 0) {
    points += Math.min(4, payoffHits.length);
    reasons.push(`payoff named: ${payoffHits.join(", ")}`);
  }

  // Punch mechanisms: jokes whose twist is not a connector at all. Up to 8
  // points here, so a line cannot farm the cap by stacking mechanisms.
  let mechanisms = 0;
  const mechanismNotes: string[] = [];
  // Irony by redefinition: a quoted marketing word meets the truth
  // ("'serverless' really costs" — the bill redefines the word).
  if (/['"][^'"]+['"]/.test(text) && (low.includes("costs") || low.includes("teach you"))) {
    mechanisms += 6;
    mechanismNotes.push("irony: quoted word redefined by the bill");
  }
  // Superlative timing: the worst thing happens at the single worst moment.
  if (low.includes("only") && low.includes("ever")) {
    mechanisms += 5;
    mechanismNotes.push("superlative timing: the only demo that counts");
  }
  // Reversal pairs: the same thing is mocked then inherited, and so on.
  for (const [a, b] of REVERSAL_PAIRS) {
    if (countTerm(text, a) > 0 && countTerm(text, b) > 0) {
      mechanisms += 6;
      mechanismNotes.push(`reversal: '${a}' then '${b}'`);
      break;
    }
  }
  // Time compression: obsolescence measured in a cup of coffee.
  if (low.includes("before your coffee")) {
    mechanisms += 5;
    mechanismNotes.push("time compression: dead before the coffee cools");
  }
  // Repetition: the ritual reports nothing, day after day.
  if (low.includes("in a row") || low.includes("same as yesterday")) {
    mechanisms += 5;
    mechanismNotes.push("repetition: the same report, day after day");
  }
  // Number contrast: two different magnitudes in one line (three days of
  // senior effort against ten minutes of a newcomer).
  const distinctNumbers = [...new Set(NUMBER_WORDS.filter((w) => countTerm(text, w) > 0))];
  if (distinctNumbers.length >= 2) {
    mechanisms += 4;
    mechanismNotes.push(`number contrast: ${distinctNumbers.join(" vs ")}`);
  }
  if (mechanisms > 0) {
    points += Math.min(8, mechanisms);
    reasons.push(`${mechanismNotes.join("; ")} (+${Math.min(8, mechanisms)})`);
  }

  points = Math.min(WEIGHTS.funnyFirstRead, points);
  return { name: "funny on first read", points, max: WEIGHTS.funnyFirstRead, reasons };
}

/**
 * Criterion 3 (20 pts): sounds like a fortune cookie — short and declarative,
 * with its twist coming from the engineer's world of code, deploys, bugs and
 * standups.
 *
 * Declarative single sentences in the 60-110 character band earn the most;
 * questions, exclamations and rambling lines lose points. Domain density is
 * credited again here because the criterion names the engineer's world
 * explicitly: the twist must come from code, deploys, bugs or standups, not
 * from generic office life.
 */
function scoreSoundsLikeFortune(text: string): CriterionScore {
  const reasons: string[] = [];
  let points = 0;
  const chars = charCount(text);
  const words = wordsOf(text);

  // Declarative shape: up to 6 points.
  if (!text.includes("?")) {
    points += 3;
    reasons.push("declarative, not a question");
  } else {
    reasons.push("phrased as a question: not a fortune");
  }
  const exclamations = (text.match(/!/g) ?? []).length;
  if (exclamations === 0) {
    points += 3;
    reasons.push("no exclamation: cookie voice, not a shout");
  } else {
    points += Math.max(0, 3 - exclamations);
    reasons.push("exclamation weakens the cookie voice");
  }

  // Length band: fortune cookies are short. Up to 5 points.
  if (chars >= 60 && chars <= 110) {
    points += 5;
    reasons.push(`${chars} chars: short fortune length`);
  } else if (chars > 110) {
    points += 2;
    reasons.push(`${chars} chars: near the cap, long for a cookie`);
  } else if (chars >= 40) {
    points += 4;
    reasons.push(`${chars} chars: short`);
  } else {
    points += 1;
    reasons.push(`${chars} chars: too short to carry a twist`);
  }

  // Twist from the engineer's world: up to 6 points by domain density.
  let domain = 0;
  for (const { term, weight } of ENGINEER_TERMS) {
    if (countTerm(text, term) > 0) domain += weight;
  }
  const domainPoints = clamp(Math.round(domain / 3), 0, 6);
  points += domainPoints;
  reasons.push(`engineer-world twist density ${domainPoints}/6`);

  // One sentence reads more like a cookie than a paragraph: up to 3 points.
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  if (sentences <= 2) {
    points += 3;
    reasons.push(`${sentences} sentence(s): tight cookie shape`);
  } else {
    reasons.push(`${sentences} sentences: rambling for a cookie`);
  }
  void words;

  points = Math.min(WEIGHTS.soundsLikeFortune, points);
  return { name: "sounds like fortune", points, max: WEIGHTS.soundsLikeFortune, reasons };
}

/**
 * Criterion 4 (15 pts): fresh — a line the reader has not already seen on a
 * mug, a sticker or a conference slide.
 *
 * Starts at full marks and loses them to stock phrases and familiar tropes,
 * then earns some back for fresh pairings: an inanimate thing with intent,
 * a reversal of who acts on whom, a specific detail no mug would print.
 * A line that is nothing but a stock phrase ends near zero here.
 */
function scoreFresh(text: string): CriterionScore {
  const reasons: string[] = [];
  let points = WEIGHTS.fresh;

  for (const { phrase, penalty } of STOCK_PHRASES) {
    if (countTerm(text, phrase) > 0) {
      points -= penalty;
      reasons.push(`stock phrase: '${phrase}' (-${penalty})`);
    }
  }

  for (const trope of FAMILIAR_TROPES) {
    if (countTerm(text, trope) > 0) {
      points -= 2;
      reasons.push(`familiar trope: '${trope}' (-2)`);
    }
  }

  const freshHits = FRESHNESS_SIGNALS.filter((s) => countTerm(text, s) > 0);
  if (freshHits.length > 0) {
    const bonus = Math.min(6, 3 * freshHits.length);
    points += bonus;
    reasons.push(`fresh pairing: ${freshHits.join("; ")} (+${bonus})`);
  }

  if (reasons.length === 0) {
    reasons.push("no stock phrase, no familiar trope: reads new");
  }

  points = clamp(points, 0, WEIGHTS.fresh);
  return { name: "fresh", points, max: WEIGHTS.fresh, reasons };
}

/**
 * Criterion 5 (10 pts): tight — every word earns its place and the funniest
 * word sits at the end.
 *
 * Ideal one-liners run 12-20 words. Filler words cost a point each. Ending
 * on a strong content word earns the last points; ending on a weak trailing
 * word loses them. A line that ends mid-setup (on "and", "the", "a") scores
 * nothing for its ending.
 */
function scoreTight(text: string): CriterionScore {
  const reasons: string[] = [];
  let points = 0;
  const words = wordsOf(text);
  const low = lower(text);

  // Word-count band: up to 4 points.
  if (words.length >= 12 && words.length <= 20) {
    points += 4;
    reasons.push(`${words.length} words: tight one-liner band`);
  } else if (words.length >= 9 && words.length <= 24) {
    points += 3;
    reasons.push(`${words.length} words: acceptable length`);
  } else if (words.length < 9) {
    points += 1;
    reasons.push(`${words.length} words: thin, little room for a joke`);
  } else {
    points += 1;
    reasons.push(`${words.length} words: wordy for a cookie`);
  }

  // Filler words: up to 3 points, one lost per filler found.
  const fillers = FILLER_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, "i").test(low));
  const fillerPoints = Math.max(0, 3 - fillers.length);
  points += fillerPoints;
  if (fillers.length > 0) {
    reasons.push(`filler words: ${fillers.join(", ")} (-${fillers.length})`);
  } else {
    reasons.push("no filler words");
  }

  // The ending: up to 3 points.
  const end = lastWord(text);
  if (STRONG_ENDINGS.includes(end)) {
    points += 3;
    reasons.push(`ends on '${end}': the punch word sits last`);
  } else if (WEAK_ENDINGS.includes(end)) {
    reasons.push(`ends on '${end}': trails off after the punchline`);
  } else if (["and", "the", "a", "to", "of"].includes(end)) {
    reasons.push(`ends on '${end}': ends mid-setup`);
  } else {
    points += 2;
    reasons.push(`ends on '${end}': a content word, not the punch word`);
  }

  points = Math.min(WEIGHTS.tight, points);
  return { name: "tight", points, max: WEIGHTS.tight, reasons };
}

/** Score one candidate on all five criteria, in the brief's order. */
function scoreCandidate(candidate: Candidate): ScoredCandidate {
  const text = candidate.text;
  const criteria = [
    scoreFortuneForEngineer(text),
    scoreFunnyFirstRead(text),
    scoreSoundsLikeFortune(text),
    scoreFresh(text),
    scoreTight(text),
  ];
  const total = criteria.reduce((sum, c) => sum + c.points, 0);
  return {
    candidate,
    criteria,
    total,
    chars: charCount(text),
    words: wordsOf(text).length,
  };
}

// ---------------------------------------------------------------------------
// The gate: every check the brief's sealed scorer applies
// ---------------------------------------------------------------------------

interface GateResult {
  ok: boolean;
  failures: string[];
  chars: number;
  bytes: number;
  lines: number;
}

/**
 * Re-check the brief's gate on a finished entry text:
 *  - UTF-8 text of 1 to 120 characters (code points, matching the brief's
 *    "characters"; a lone surrogate would fail the UTF-8 round-trip);
 *  - a single line (no \n or \r anywhere);
 *  - not only white space.
 * Returns the failures, if any, so the caller can exit non-zero.
 */
function checkGate(text: string): GateResult {
  const failures: string[] = [];
  const chars = charCount(text);
  const bytes = Buffer.byteLength(text, "utf8");
  const lines = text.split("\n").length;

  // Valid UTF-8: a round-trip through Buffer must reproduce the text exactly,
  // and no lone surrogate may hide in it.
  const roundTripped = Buffer.from(text, "utf8").toString("utf8") === text;
  const hasLoneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text);
  if (!roundTripped || hasLoneSurrogate) {
    failures.push("not valid UTF-8");
  }
  if (chars < MIN_CHARS) {
    failures.push(`empty: ${chars} characters (need at least ${MIN_CHARS})`);
  }
  if (chars > MAX_CHARS) {
    failures.push(`${chars} characters exceeds the ${MAX_CHARS} limit`);
  }
  if (text.trim().length === 0) {
    failures.push("only white space");
  }
  if (text.includes("\n") || text.includes("\r")) {
    failures.push(`not a single line (${lines} lines)`);
  }
  return { ok: failures.length === 0, failures, chars, bytes, lines };
}

/** The output directory: $MAKEFUN_OUTPUT_DIR, else the brief's /output. */
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  return "/output";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Fortune Cookie Funnies for Engineers");
  console.log(`Candidates: ${CANDIDATES.length}  |  Gate: 1-${MAX_CHARS} chars, single line, valid UTF-8`);
  console.log(`Scorer weights (brief order): ${WEIGHTS.fortuneForEngineer}/${WEIGHTS.funnyFirstRead}/${WEIGHTS.soundsLikeFortune}/${WEIGHTS.fresh}/${WEIGHTS.tight} = ${TOTAL_WEIGHT}`);
  console.log("");

  // Score every candidate first, so a gate failure in one line never hides
  // the table, and so the winner is chosen from the full field.
  const scored = CANDIDATES.map(scoreCandidate);

  // Gate-check every candidate up front: a line over the cap cannot win,
  // however funny it is, and must be reported rather than silently dropped.
  let sawGateFailure = false;
  for (const s of scored) {
    const gate = checkGate(s.candidate.text);
    if (!gate.ok) {
      sawGateFailure = true;
      console.log(`GATE FAIL #${s.candidate.id}: ${gate.failures.join("; ")}`);
    }
  }
  if (sawGateFailure) {
    console.error("One or more candidates fail the gate; refusing to pick a winner.");
    process.exit(1);
  }

  // Rank: highest total first; ties go to the smaller text (fewer bytes),
  // matching the brief's tie-break, then to the lower candidate id so the
  // order is fully deterministic.
  const ranked = [...scored].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    const bytesA = Buffer.byteLength(a.candidate.text, "utf8");
    const bytesB = Buffer.byteLength(b.candidate.text, "utf8");
    if (bytesA !== bytesB) return bytesA - bytesB;
    return a.candidate.id - b.candidate.id;
  });

  // The full table, so the choice is auditable.
  console.log("Rank  #  Total  C1  C2  C3  C4  C5  Chars  Words  Line");
  for (let i = 0; i < ranked.length; i++) {
    const s = ranked[i];
    const c = s.criteria.map((x) => x.points);
    console.log(
      `${String(i + 1).padStart(4)}  ${String(s.candidate.id).padStart(2)}  ${String(s.total).padStart(5)}  ` +
        `${String(c[0]).padStart(2)}  ${String(c[1]).padStart(2)}  ${String(c[2]).padStart(2)}  ` +
        `${String(c[3]).padStart(2)}  ${String(c[4]).padStart(2)}  ${String(s.chars).padStart(5)}  ` +
        `${String(s.words).padStart(5)}  ${s.candidate.text}`,
    );
  }
  console.log("");

  const winner = ranked[0];
  const runnerUp = ranked[1];
  console.log(`Winner: #${winner.candidate.id} at ${winner.total}/${TOTAL_WEIGHT} pts (${winner.chars} chars)`);
  console.log(`  ${winner.candidate.text}`);
  console.log(`Runner-up: #${runnerUp.candidate.id} at ${runnerUp.total}/${TOTAL_WEIGHT} pts (${runnerUp.chars} chars)`);
  console.log(`  ${runnerUp.candidate.text}`);
  for (const crit of winner.criteria) {
    console.log(`  ${crit.name}: ${crit.points}/${crit.max} — ${crit.reasons.join("; ")}`);
  }
  console.log("");

  // Write the winning line, read it back, and re-check every gate on the
  // file as written — not on the string in memory.
  const dir = outputDir();
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "entry.txt");
  writeFileSync(outPath, winner.candidate.text, "utf8");
  const readBack = readFileSync(outPath, "utf8");
  if (readBack !== winner.candidate.text) {
    console.error("Read-back mismatch: entry.txt does not hold the winning line.");
    process.exit(1);
  }
  const gate = checkGate(readBack);
  console.log(`Wrote ${outPath}: ${gate.chars} chars, ${gate.bytes} bytes, ${gate.lines} line(s)`);
  if (!gate.ok) {
    console.error(`GATE FAIL on written entry: ${gate.failures.join("; ")}`);
    process.exit(1);
  }
  console.log("Gate: PASS (1-120 chars, single line, valid UTF-8, not only whitespace)");
  console.log(`Entry: ${readBack}`);
}

main();
