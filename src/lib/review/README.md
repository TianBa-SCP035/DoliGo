# 复习与点词逻辑 · 给页面合入用

给七号合入共用学习页的纯函数入口：`import { ... } from '../../lib/review'`（按页面相对路径调整）。`loadReviewCatalog` 及下列复习函数的约定保持不变。场景与阅读的合并目录见下方「学习目录（增量合并）」。本模块不写页面、样式或阅读进度。

查看释义、例句、说明或中文，一律不记为掌握。掌握只来自学习者自己点的自标按钮。

## 必要规则

1. **按句取目标。** 使用 `sentenceTargetCardIds(encounter, index)` 或 `buildReviewEncounterView` 返回的 `sentences[i].targetCardIds`。禁止用 encounter 级 `targetCardIds`（或 v4 的 `taughtReference` / `taughtReferences`）去匹配该条全部句子。`v4-transfer-16` 中 *The last bus is at ten.* 对应 `l17-w-last`（末班的），*I was home last weekend.* 对应 `L08-V02`（上一个）。`unionTargetCardIds` 只是合集，仅作兼容。
2. **展开键是 `unitId + cardId`。** 同一张卡出现在两句里时，只在当前点击的那一句下面展开。例如 `rv-cross-L06-V03` 的 *wait* 在两句都出现，点第二句不得把第一句的同一张卡也打开。用 `isCardExpandedAt(session.expanded, unitId, cardId)` 判断。
3. **词卡分层揭开。** 默认只显示词头和词性；先 `revealSense`，再分别 `toggleExamples` / `toggleNotes`。释义未揭开时，后两步不会生效。
4. **点词范围。** 偏移是 0 起、右开、按 Unicode 码点。当前包都是 BMP，与 `String#slice` 一致，但仍请用 `segmentsForUnit` 或 `cardIdAtCodePoint`，不要自己按词面全文搜索。复习句的 unit id 仍以 `independent-vocab-review-pack-v1::` 为前缀，不要改写成 v1.1。
5. **合并卡。** 用 `getCard(cardIndex, id)` 查卡，别名会回到正式 id，例如 `L07-P02` → `L01-P01`。

## 页面侧最小用法

```ts
import {
  loadReviewCatalog,
  getReviewEncounter,
  buildReviewEncounterView,
  createReviewCardSession,
  toggleCardSession,
  isCardExpandedAt,
  updateReveal,
  revealSense,
  toggleExamples,
  getCard,
  VIEWING_IS_NOT_MASTERY,
  SELF_MARK_LABELS,
} from '../../lib/review';

const { anchorsPack, cardIndex, reviewPack } = loadReviewCatalog();
const encounter = getReviewEncounter(reviewPack.reviewEncounters, 'v4-transfer-16');
const view = buildReviewEncounterView(encounter!, anchorsPack.units);

// 渲染 view.sentences[].segments：
//   type === 'tap' 时可点；点击时：
//   setSession(toggleCardSession(session, sentence.unitId, segment.cardId))
// 仅当 isCardExpandedAt(session.expanded, sentence.unitId, cardId) 时，
// 在该句下方渲染 getCard(cardIndex, cardId)，并用 session.reveal 控制揭开步骤。
```

中文按整段展开由页面自己处理。自标文案可用 `SELF_MARK_LABELS`，进度写入不在本模块。

数据包在 `src/content/`，清单与哈希见 `src/content/manifest.ts`。

## 复习会话保存（新增）

`loadReviewSession(window.localStorage, encounterIds)` 返回 `{ok:true,session}` 或 `{ok:false,error}`。加载失败不要用空记录覆盖原记录，应展示失败状态并可返回首页。所有存储在隔离键 `REVIEW_SESSION_KEY`，不读取旧站学习记录。

当前条目使用 `currentReviewEncounterId(session)`；completed 时渲染结束页。
点击普通「下一条」调用 `commitReviewAdvance(storage,session)`，自标调用第三参数 `'again'` 或 `'recognized'`。仅 result.ok 时更新 session、清空展开和中文；失败保留当前条目及揭义并显示 error。不要在揭义、看中文或退出时自标。marks 仅表示整段相遇的自述，不能当成其中所有词卡的掌握。

结束页重看调用 `commitReviewRestart`，只重置位置，保留全部标记（含待再看）；同样只在保存成功后更新状态。末项前进会保存 completed=true，不循环卡住末项。退出再进入使用 load 恢复。


## 学习目录（增量合并）

页面若要列出已接入场景（现为十二段，含既有游戏/工作篇及后补增量）、全部已接阅读（现为十一篇，含一篇外部改编）、合并后的点词范围，以及解析后续新卡，请使用 `loadLearningCatalog()`（别名 `loadSceneCatalog()`），列表用 `.scenes` / `.readings`（不要只用 `.readingPack.readings`，会漏新篇）。外部改编阅读还带可选的 `sourceAttribution` 与 `source` 字段，见 `docs/SOURCED_READING_API.md`。统一目录只做增量追加，不设主题路径，不改首页。**不要**改 `loadReviewCatalog()` 的返回值，也不要把未接入的 `everyday-scenes-pack-v2` 加进去。`readingPack` 与 `wiredReadingPackId` 仍指向 v2.1。

```ts
import {
  loadLearningCatalog,
  loadReviewCatalog,
  findScene,
  findReading,
  getCard,
  segmentsForUnit,
  REVIEW_SESSION_KEY,
} from '../../lib/review';

const learning = loadLearningCatalog();
const dinner = findScene(learning, 'scene-change-dinner-time');
const shops = findReading(learning, 'reading-shops-afternoon');
const card = getCard(learning.cardIndex, 'sc5-book-a-table');
const units = learning.anchorsPack.units.filter((unit) => unit.parentId === dinner?.id);

// 复习页和会话仍只用 loadReviewCatalog()：
const review = loadReviewCatalog();
// review.reviewPack.reviewEncounters 仍是原来的 36 条，顺序不变
// 存储键仍是 REVIEW_SESSION_KEY
```

`loadReviewCatalog().cards` 仍是 273 张，不含后补新卡，以免复习索引被当成已扩展。场景/阅读点词用 `loadLearningCatalog().cardIndex`。独立背词请改用 `loadVocabCatalog()`（可解析 273+8+10+9+9+9 张卡，不含复习相遇）；`.supplementalCards` 仍只指 v3 原八卡，已有各组词卡标识不改，本轮 9 张新卡在 `.extensionCards`、`NEW_SCENE_V7_CARD_IDS`、`NEW_READING_V6_CARD_IDS`。不要把这些新卡并入既有背词分组。不要继续从 `loadReviewCatalog()` 取背词卡表，也不要把新卡写入 36 条相遇。合并锚点的 id 是 `content-text-anchors-v1.1+scenes-v3+v4+reading-v3+scenes-v5+reading-v4+scenes-v6+reading-v5+scenes-v7+reading-v6`，旧锚点文件与 unit id 都不改。更完整的符号表见 `LEARNING_CATALOG.md`。本稿是内容接入，不等于实屏验收或产品已上线。

### 独立背词应改用 `loadVocabCatalog()`

```ts
import { loadVocabCatalog, getCard } from '../../lib/review';

const vocab = loadVocabCatalog();
const card = getCard(vocab.cardIndex, 'sc5-book-a-table');
// 默认可学队列：vocab.defaultQueueCards（不含 optional）
```

当前 `src/adapters/wiring-words.ts` 仍读 `loadReviewCatalog()` 里课 1 的 8 张卡，本目录未改那个适配层。
