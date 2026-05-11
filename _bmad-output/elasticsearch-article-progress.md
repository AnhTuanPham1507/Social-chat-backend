# Elasticsearch Knowledge Review & Article Progress

**Started:** 2026-05-06
**Goal:** Quiz user across all ES concepts applied in Story 5.3 → identify gaps → co-write article that reinforces weak spots, not just re-summarizes the implementation.
**Mode:** Tutor (per `CLAUDE.md`). Do NOT write the article for them; co-design outline after waves complete.

---

## Session Status

- ✅ Wave 1 (foundations: why ES, dual-write, version_type, query layout) — graded, with carryover
- 🟡 Wave 2 (analyzer chain + autocomplete) — graded, with **4 follow-ups still pending**
- ⬜ Wave 3 (production hardening) — queued, not started
- ⬜ Article outline & draft — queued, not started

---

## Pending Follow-ups (resume here)

These are the *specific gaps* the user did not close before pausing. Each is a single concrete question. Re-ask cold tomorrow before moving to Wave 3.

### From Wave 1 (carryover — user said "I have known all of it" without demonstrating)

1. **Q3a — version_type=external timeline.** Walk T=0 → T=6 with two edits (v=100, v=300) delivered to ES out of order. What ES exception fires at T=6? What's the document final state with vs. without `version_type=external`?
2. **Q4a — fuzzy boost rationale.** Why is `fuzzy=3` (highest boost) when exact is the "best" match? Fill the blank: "BM25 scores fuzzy hits ____ than exact hits because fuzzy tokens ____ from query tokens. The boost is ____, not preference."

### From Wave 2 (explicitly asked, not yet answered)

3. **Q1a/Q5 follow-up — diacritic folding filter name.** Which exact token filter in the chain turns `"Hà Nội"` → `"ha noi"`? (Expected answer: `icu_folding` or `asciifolding` — confirm which one is in their config.)
4. **Q6 — operational killer reason for search-time synonyms.** Walk the concrete scenario: synonyms `[laptop, máy tính xách tay]` → today add `notebook`. User searches `"notebook"`. Index-time vs. search-time: does old doc (containing `"laptop"`) match? **The answer reveals why search-time wins operationally** — and the reason is *something you don't have to do that you'd otherwise have to do.*
5. **Q7 — `operator: "and"` rationale.** With user typing `"máy tính x"`, what does `or` return vs. `and`? Frame: autocomplete is *narrowing-as-you-type*, not broadening. Make them say it.
6. **Q8 follow-up — highlight gotcha for prefix clause.** Without `highlight_query`, would highlighting work for the `prefix` clause in their bool/should? (Hint: prefix doesn't expand terms — it just matches them. So...?)

---

## Wave 1 — Detailed Record

### Q1: Why ES vs Postgres FTS / Mongo $text?
**User answer:** "Postgres/Mongo don't support complex search; ES supports Vietnamese, ignores punctuation, has analyzers for autocomplete/synonym/fuzziness."
**Grade:** 🟡 Listed features, missed underlying reasons.
**Gaps surfaced:** Operational separation (search workload off OLTP), Vietnamese-specific tokenization (ICU vs whitespace), BM25 vs `ts_rank` ranking quality.

### Q1a: Damaging counterexample for "use Postgres tsvector"?
**User answer:** "Postgres supports complex search but performance is bad."
**Grade:** 🟡 Got operational separation generically. Did NOT answer the Vietnamese-specific scenario (`"ha noi"` → `"Hà Nội"` via which mechanism?).
**Carryover:** see pending follow-up #3 (folding filter name).

### Q2: Why not dual-write Postgres + ES in same transaction?
**User answer:** "ES not source of truth, can sync later, maintain request performance."
**Grade:** 🟡 Got the spirit but missed the **correctness** angle (the real reason).

### Q2a: Concrete failure modes for dual-write?
**User answer:** "Wrap in transaction → ES failure breaks handler. Don't wrap → ES inconsistent data."
**Grade:** ✅ Correctly identified the dilemma.
**Vocabulary the user is missing (provided to them):** **2PC** (two-phase commit — ES has no XA participant, so atomic commit across both is impossible) and **outbox pattern** (write events to a table inside the same Postgres txn; separate publisher reads from it). **CDC + Kafka is effectively a free outbox** — that's the architectural payoff.

### Q3: Race condition `version_type=external` prevents?
**User answer:** "updatedAt is source of truth — tells ES which is older. Version maintained on reindex."
**Grade:** 🟡 Concept right, no two-actor timeline.

### Q3a: Walk T=0 → T=6 timeline.
**User answer:** "I have known all of it move on."
**Grade:** ❌ UNVERIFIED — see carryover follow-up #1. Article cannot ship without this airtight.

### Q4: Why `bool/should` with fuzzy/exact/prefix at boosts 3/1/0.5?
**User answer:** "Fuzzy for typos, prefix for autocomplete, exact gets boosted to display most matched docs first. Safety net = fuzzy."
**Grade:** ✅ Mostly right. Two corrections issued:
- **Prefix in main query ≠ autocomplete.** Autocomplete is the separate `search_as_you_type` field with `bool_prefix`. Prefix in `bool/should` handles partial-term match in the *main* search, not the typeahead.
- **Boost interpretation:** fuzzy=3 is highest because BM25 naturally scores fuzzy hits *lower* (different tokens). Boost is **compensation**, not preference. Exact still wins overall via raw BM25.

### Q4a: Why fuzzy boost is highest?
**User answer:** "I have known all of it move on."
**Grade:** ❌ UNVERIFIED — see carryover follow-up #2.

---

## Wave 2 — Detailed Record

### Q5: Analyzer chain components from memory?
**User answer:** "Char filter — serialize content (HTML strip, icon→text, special chars). Tokenizer — split into segments. Token filters — stopwords, lowercase, stem."
**Grade:** 🟡 Generic theory correct, did NOT recall *their actual chain*.
**The actual chain (need to confirm by reading code tomorrow):**
- Tokenizer: `icu_tokenizer` — Unicode-aware word boundaries (handles Vietnamese syllable spacing better than `standard`)
- Token filters (approximate): `lowercase`, `icu_folding` (or `asciifolding` — diacritic stripping), `synonym` filter (search-time)
- Char filter: nothing significant for posts (no HTML)

### Q6: Synonyms — index time or search time? Why?
**User answer:** "Search time. Index time would break phrase search and highlight. ES uses synonym graph to build parallel queries without breaking token count."
**Grade:** ✅ Sophisticated — `synonym graph` is correct vocabulary.
**But:** The "phrase + highlight" reasoning is *secondary*. The **operational killer reason** (#4 in pending follow-ups) was not stated: with search-time, you can update the synonym list without reindexing the corpus. With index-time, every synonym change = full reindex of all docs.

### Q7: `search_as_you_type` shadow fields + `operator: "and"`?
**User answer (shadow fields):** "Standard field, 2gram, 3gram, index_prefix. 2gram/3gram match completed words; index_prefix for last word."
**Grade:** ✅ Correct. The mental model "all-but-last-token via shingle fields, last token via edge prefix" is right.
**Operator='and':** Not answered — see pending follow-up #5.

### Q8: Highlight gotcha — what does ES highlight by default for synonym-path matches?
**User answer:** "I don't know."
**Grade:** ⚠ Honest gap — explained as tutor:
- Default highlighter marks terms based on what's *literally* in the user's query string. Doesn't always pick up synonym-expanded matches in complex `bool` queries.
- **Fix:** Pass `highlight_query` to the highlighter explicitly — usually the same `bool/should` that produced the match. Now the highlighter knows about all clauses including synonym expansion.
- **One-line takeaway:** *If your match path uses synonyms (or any expansion the highlighter can't infer from raw query text), set `highlight_query` to the same bool clause that produced the match. Otherwise highlights silently lie.*
- Follow-up question pending — see pending follow-up #6.

### Q9: Why min-char ≥ 2 gate?
**User answer:** "Lots of unrelated results — bad UX."
**Grade:** ✅ UX angle covered. Missed the **system angle**: 1-char queries on `_index_prefix` match *every word starting with that letter* across the entire corpus → millions of postings → CPU/latency spike. Min-char gate is **backpressure**, not a feature. Article framing: *"It's not a feature — it's a backpressure mechanism."*

---

## Wave 3 — Queued (Production Hardening)

Topics to cover when Wave 2 follow-ups close:

1. **Atomic alias swap** — timestamp suffix on index name + `getAlias` discovery + `updateAliases` with atomic add/remove actions in single API call. Why this beats "delete index, recreate, re-index."
2. **`infra-reindex-posts` CLI runbook** — when do you actually run it? Steps: create new index with new mapping → reindex from old or rebuild from Mongo source → atomic alias swap → delete old after grace period. Where is the file? `scripts/cli/commands/infra-reindex-posts.command.ts`.
3. **Result enrichment split** — ES holds only what's needed for ranking (text fields, timestamps); Mongo holds full post content. Search returns ES IDs + scores → fetch full PostDTOs from Mongo in ES rank order. Why split? Index size + write amplification + flexibility.
4. **`search_after` cursor + base64 encoding** — why not `from`/`size`? Deep pagination performance cliff (`from=10000` requires sorting all 10000 prior docs per shard). `search_after` uses last sort values from previous page, O(1) per page regardless of depth. Base64 encode the cursor so it's opaque to clients.

---

## Article Outline (Preliminary — Refine During/After Wave 3)

This is a sketch, not a contract. Fill in concrete code/config/JSON examples as gaps close.

1. **Why Elasticsearch (vs Postgres FTS, Mongo $text)** — workload separation, BM25, Vietnamese tokenization
2. **Sync Architecture: CDC + Kafka as Outbox** — no dual-write, no 2PC, replayable
3. **Analyzer Chain Walkthrough** — `icu_tokenizer` → `lowercase` → `icu_folding`/`asciifolding` → `synonym` (search-time). Concrete JSON. The `"hà nội"` ↔ `"ha noi"` example.
4. **Search-Time vs Index-Time Synonyms** — operational reason: change synonyms without reindexing. Synonym graph preserves token count.
5. **Query Design: bool/should + Fuzzy/Exact/Prefix** — boost rationale (BM25 compensation, not preference). Each clause's failure mode it catches.
6. **Autocomplete Mechanics** — `search_as_you_type` + shadow fields (`._2gram`, `._3gram`, `._index_prefix`). `bool_prefix` + `operator: "and"` (narrowing UX).
7. **Min-Char Gate as Backpressure** — pathological 1-char query economics.
8. **Highlighting Gotcha** — synonym-path matches need explicit `highlight_query`.
9. **Production Hardening:**
   - Atomic alias swap (`updateAliases` atomicity)
   - `version_type=external` + `updatedAt.getTime()` (out-of-order consumer + reindex-vs-live races) — *full T=0→T=6 timeline diagram*
   - Reindex CLI runbook (`infra-reindex-posts`)
10. **Result Enrichment** — ES = ranking only, Mongo = content authority.
11. **Pagination: `search_after` Over `from`/`size`** — deep-pagination performance cliff.

---

## Resume Instructions for Tomorrow

1. Re-ask the **6 pending follow-ups** above (Wave 1 carryover #1, #2 + Wave 2 #3, #4, #5, #6). Be cold — do not give the user the answers up front. Make them recall.
2. If they get stuck on #1 (Q3a timeline), open `apps/feed/src/driven-adapters/repos/post-search-repository.adapter.ts` and read the `index()` call together — show the actual `version_type` config in their code.
3. If they get stuck on #3 (folding filter), open `apps/feed/src/driven-adapters/repos/post-search.index.ts` and let them read their analyzer mapping cold.
4. After all follow-ups close → kick off **Wave 3** (4 questions on production hardening — see queued list).
5. After Wave 3 → **co-design article outline** with the user. Use the preliminary sketch above as a strawman, but let the user reorder / drop / expand sections based on what they found hardest in the quiz.
6. **Article drafting rule:** Tutor mode still applies. They draft each section; you critique. Do NOT ghostwrite the article. Exception: if they explicitly say "help me draft section X," you may draft it *after* they articulate the structure they want.
