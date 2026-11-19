from pathlib import Path

root = Path("C:/Users/TianBa/Test_Factory/多莉国重构")
replacements_by_file = {
    "tests/wiring/bulk-ready.test.ts": [
        ("expect(vocab.libraryCards).toHaveLength(214);", "expect(vocab.libraryCards).toHaveLength(222);"),
        ("expect(vocab.cards).toHaveLength(532);", "expect(vocab.cards).toHaveLength(540);"),
        ("expect(vocab.cards.slice(-214)).toEqual(vocab.libraryCards);", "expect(vocab.cards.slice(-222)).toEqual(vocab.libraryCards);"),
    ],
    "tests/wiring/depth-nov16.test.ts": [
        ("expect(LIBRARY_VOCAB_CARD_IDS).toHaveLength(214);", "expect(LIBRARY_VOCAB_CARD_IDS).toHaveLength(222);"),
        ("expect(vocab.libraryCards).toHaveLength(214);", "expect(vocab.libraryCards).toHaveLength(222);"),
        ("expect(new Set(vocab.libraryCards.map((card) => card.id)).size).toBe(214);", "expect(new Set(vocab.libraryCards.map((card) => card.id)).size).toBe(222);"),
        ("expect(learning.cards).toHaveLength(532);", "expect(learning.cards).toHaveLength(540);"),
    ],
    "tests/wiring/word-library-app.test.tsx": [
        ("expect(libraryWordEntries).toHaveLength(214);", "expect(libraryWordEntries).toHaveLength(222);"),
    ],
    "tests/wiring/word-library.test.ts": [
        ("expect(libraryWords).toHaveLength(214);", "expect(libraryWords).toHaveLength(222);"),
        ("expect(libraryWordEntries).toHaveLength(214);", "expect(libraryWordEntries).toHaveLength(222);"),
    ],
}

for rel, reps in replacements_by_file.items():
    path = root / rel
    text = path.read_text(encoding="utf-8")
    for old, new in reps:
        if old not in text:
            raise SystemExit(f"{rel} missing: {old}")
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print("updated", rel)
print("thicken test counts updated")
