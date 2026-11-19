# Update tests that still pin libraryCards=121 and readings=17.
from pathlib import Path
root = Path(r"C:\Users\TianBa\Test_Factory\多莉国重构")

# --- bulk-ready.test.ts ---
p = root / "tests/wiring/bulk-ready.test.ts"
t = p.read_text(encoding="utf-8")
replacements = [
    ("expect(vocab.libraryCards).toHaveLength(121);", "expect(vocab.libraryCards).toHaveLength(214);"),
    ("expect(vocab.cards).toHaveLength(439);", "expect(vocab.cards).toHaveLength(532);"),
    ("expect(vocab.cards.slice(-121)).toEqual(vocab.libraryCards);", "expect(vocab.cards.slice(-214)).toEqual(vocab.libraryCards);"),
    ("const cat=loadLearningCatalog(); expect(cat.readings).toHaveLength(17);", "const cat=loadLearningCatalog(); expect(cat.readings).toHaveLength(21);"),
]
for old, new in replacements:
    if old not in t:
        raise SystemExit(f"bulk-ready missing: {old}")
    t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

# --- depth-nov16.test.ts ---
p = root / "tests/wiring/depth-nov16.test.ts"
t = p.read_text(encoding="utf-8")
replacements = [
    ("expect(LIBRARY_VOCAB_CARD_IDS).toHaveLength(121);", "expect(LIBRARY_VOCAB_CARD_IDS).toHaveLength(214);"),
    ("expect(vocab.libraryCards).toHaveLength(121);", "expect(vocab.libraryCards).toHaveLength(214);"),
    (
        "expect(vocab.libraryCards.slice(30).map((card) => card.id)).toEqual([...DEPTH_NOV16_VOCAB_CARD_IDS]);",
        "expect(vocab.libraryCards.slice(30, 121).map((card) => card.id)).toEqual([...DEPTH_NOV16_VOCAB_CARD_IDS]);",
    ),
    ("expect(new Set(vocab.libraryCards.map((card) => card.id)).size).toBe(121);", "expect(new Set(vocab.libraryCards.map((card) => card.id)).size).toBe(214);"),
    ("expect(learning.cards).toHaveLength(439);", "expect(learning.cards).toHaveLength(532);"),
    ("expect(learning.scenes).toHaveLength(15);", "expect(learning.scenes).toHaveLength(22);"),
    ("expect(learning.readings).toHaveLength(17);", "expect(learning.readings).toHaveLength(21);"),
]
for old, new in replacements:
    if old not in t:
        raise SystemExit(f"depth-nov16 missing: {old}")
    t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

# --- word-library-app.test.tsx ---
p = root / "tests/wiring/word-library-app.test.tsx"
t = p.read_text(encoding="utf-8")
old = "expect(libraryWordEntries).toHaveLength(121);"
new = "expect(libraryWordEntries).toHaveLength(214);"
if old not in t:
    raise SystemExit("word-library-app missing 121")
p.write_text(t.replace(old, new, 1), encoding="utf-8")

# --- word-library.test.ts ---
p = root / "tests/wiring/word-library.test.ts"
t = p.read_text(encoding="utf-8")
replacements = [
    ("expect(libraryWords).toHaveLength(121);", "expect(libraryWords).toHaveLength(214);"),
    ("expect(libraryWordEntries).toHaveLength(121);", "expect(libraryWordEntries).toHaveLength(214);"),
]
for old, new in replacements:
    if old not in t:
        raise SystemExit(f"word-library missing: {old}")
    t = t.replace(old, new, 1)
p.write_text(t, encoding="utf-8")

print("test counts updated")
