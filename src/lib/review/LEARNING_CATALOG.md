# 学习目录接口（场景 / 阅读增量合并）

写入时间：2026-11-12（Asia/Shanghai，UTC+8）；2026-11-16 追加场景 v7 / 阅读 v6，同日再追加外部改编阅读 `sourced-reading-pack-wikivoyage-v1`。这是内容模块加载器的接口说明，不是实屏验收，也不是网站已上线。背词、场景、阅读、复习仍是四个独立栏目；统一目录只按增量 schema 追加篇目与词卡，不设主题路径，不改首页，也不把全站收成单一日常主线。已有游戏、工作篇保留。

导入路径（页面按相对位置调整）：

```ts
import { ... } from '../../lib/review';
// 或从适配层：import { ... } from '../lib/review';
```

## 保持不变的复习入口

| 符号 | 说明 |
| --- | --- |
| `loadReviewCatalog()` | 仍返回 v1.2 复习包、273 张卡、36 条相遇（顺序不变）、`content-text-anchors-v1.1` 的 122 条 unit。 |
| `reviewPack` / `anchorsPack` | 与上面相同的原始包。 |
| `REVIEW_UNIT_ID_PREFIX` | 仍为 `independent-vocab-review-pack-v1`。 |
| `REVIEW_SESSION_KEY` | 仍为 `doliguo:refactor:sandbox:review-session:v1`。 |
| `getCard` / `resolveCardId` / `indexCards` | 行为不变；给哪个 `cardIndex` 就在哪个索引里查。 |
| `segmentsForUnit` / `spanSurfaceMatches` / `sliceByCodePoints` | 点词仍按 0 起、右开、Unicode 码位。 |

复习页应继续调用 `loadReviewCatalog()`，不要把学习目录的相遇列表交给 `loadReviewSession`。本轮不写真实进度。

## 合并入口

| 符号 | 说明 |
| --- | --- |
| `loadLearningCatalog(): LearningCatalog` | 稳定合并入口。 |
| `loadSceneCatalog(): LearningCatalog` | 同一函数的别名。 |
| `findScene(catalog, id)` / `findReading(catalog, id)` | 按篇目 id 查找。 |
| `WIRED_SCENE_PACK_IDS` | `v1.1`、`v3`、`v4`、`v5`、`v6`、`v7`。 |
| `UNWIRED_SCENE_PACK_IDS` | `everyday-scenes-pack-v2`（存在但不接入）。 |
| `WIRED_READING_PACK_ID` | 仍为 `everyday-reading-pack-v2.1`（旧字段语义不变）。 |
| `WIRED_READING_PACK_IDS` | `everyday-reading-pack-v2.1`、`everyday-reading-pack-v3`、`everyday-reading-pack-v4`、`everyday-reading-pack-v5`、`everyday-reading-pack-v6`、`sourced-reading-pack-wikivoyage-v1`。 |
| `MERGED_ANCHORS_PACK_ID` | `content-text-anchors-v1.1+scenes-v3+v4+reading-v3+scenes-v5+reading-v4+scenes-v6+reading-v5+scenes-v7+reading-v6`。 |
| `NEW_SCENE_CARD_IDS` | **仅** v3 原八卡，语义不得改成后续新卡。 |
| `NEW_SCENE_V4_CARD_IDS` | 场景 v4 四张新卡。 |
| `NEW_READING_V3_CARD_IDS` | 阅读 v3 六张新卡；语义不得改。 |
| `NEW_SCENE_V5_CARD_IDS` | 场景 v5 五张增量卡；语义不得改。 |
| `NEW_READING_V4_CARD_IDS` | 阅读 v4 四张增量卡；语义不得改。 |
| `NEW_SCENE_V6_CARD_IDS` | 场景 v6 七张增量卡。 |
| `NEW_READING_V5_CARD_IDS` | 阅读 v5 两张增量卡；语义不得改。 |
| `NEW_SCENE_V7_CARD_IDS` | 场景 v7 六张增量卡。 |
| `NEW_READING_V6_CARD_IDS` | 阅读 v6 三张增量卡。 |
| `VOCAB_EXTENSION_PACK_IDS` | 在既有扩展包后追加 `everyday-scenes-pack-v7`、`everyday-reading-pack-v6`。 |
| `CONTENT_CARD_GROUPS` | 分组元数据；已有各组标识含义不变，本轮新增 `scenesV7` / `readingV6`。 |
| `loadVocabCatalog(): VocabCatalog` | 独立背词目录：可解析 273+8+10+9+9+9 张卡，不含复习相遇。 |
| `VOCAB_SOURCE_PACK_IDS` | 仍为 `independent-vocab-review-pack-v1.2`、`everyday-scenes-pack-v3`。 |
| `isDefaultVocabQueueCard(card)` | standalone 且非 optional 时为默认新卡队列成员。 |
| `sceneCardToVocabCard` / `mergeAnchorUnits` / `appendUniqueCards` | 合并用纯函数；id 冲突时抛错。`mergeAnchorUnits(base, ...supplements)` 可接收多包。 |

`LearningCatalog` 字段：

- `review`：与 `loadReviewCatalog()` 相同（273 卡、36 条相遇、v1.1 锚点）。
- `scenes`（12 篇，先旧后新，含既有游戏/工作篇）：在原 10 篇后追加 `scene-have-the-receipt`、`scene-ill-be-right-down`。
- `readings`（14 篇，须含全部已接阅读）：在原 10 篇后追加 `reading-arriving-new-city`（外部改编，无新词卡）。
- `readingPack`：仍是阅读 v2.1 原包对象，内部只有前两篇；不要改这个旧字段的含义。
- `wiredReadingPackId`：仍是 `everyday-reading-pack-v2.1`。
- `wiredReadingPackIds`：全部已接阅读包。
- `anchorsPack`：旧前缀不变，再追加场景 v7 的 32 条、阅读 v6 的 21 条，合计 366。
- `cards` / `cardIndex`：273 张旧卡在前，再 8 张 v3，再既有 28 张扩展卡，再 9 张本轮增量卡，加批量资料库30词，合计348。

## 接入页现况：哪些会自动出现，哪些还需七号消费

当前场景/阅读页（`TextLearningView`）和首页续学（`text-resume.ts`）已经遍历 `loadLearningCatalog().scenes` 与 `.readings`，并用篇目上的 `title`、`titleEn`、`levelSuggestionZh`、`settingZh`（场景）、`lines` / `paragraphs`（含 `id`）、`notes`。正文点词走合并后的 `anchorsPack` 与 `cardIndex`。

因此，本轮只要目录追加成功：

- 目录追加后，新篇会自动进入场景/阅读列表、深链和首页续学标题映射，无需改 UI，也不需要为主题单独改首页。
- 分级只作为 `levelSuggestionZh` 教学建议展示，不是认证级别。
- `wordCount` 已按现有形状填写；当前页面不展示词数，但字段可用。
- 关键词可点、不强迫答题（`optionalQuestions` 仍为空）。

七号仍需另行消费、本轮未改页面的部分：

- 独立背词适配层 `src/adapters/wiring-words.ts` 仍读 `loadReviewCatalog()` 并写死课 1 的八张卡。**扩展卡不会自动出现在背词页。** 请改用 `loadVocabCatalog()`。
- `.supplementalCards` 和 `NEW_SCENE_CARD_IDS` 仍只表示 v3 原八卡，不要改语义。既有 `NEW_SCENE_V4_CARD_IDS`、`NEW_READING_V3_CARD_IDS` 也不改。本轮 9 张新卡在 `.extensionCards`、`NEW_SCENE_V5_CARD_IDS`、`NEW_READING_V4_CARD_IDS`。
- `sourcePackIds` 仍是 v1.2 + v3；扩展包在 `extensionSourcePackIds`。
- 现有 `WordStudyView` 只展示释义和一组例句；另境例句（`transferEn` / `transferZh`）已在词卡数据里，若要展开需改消费。
- 若阅读列表误用 `catalog.readingPack.readings` 而不是 `catalog.readings`，会漏掉后补篇目；应改用 `catalog.readings`（现为十四篇）。`readingPack` 为兼容旧字段而保留。
- 一号已在 v1.7 / v1.8 把既有扩展卡拆成独立背词组。本轮 9 张新卡须走 `NEW_SCENE_V7_CARD_IDS` / `NEW_READING_V6_CARD_IDS`（或 `CONTENT_CARD_GROUPS.scenesV7` / `readingV6`），不要并入「游戏、工作与阅读」「改乘与换店」「野餐与坐过站」「快递与拿错杯」或「充电器与代收」。

## 独立背词入口

```ts
import { loadVocabCatalog, getCard, NEW_SCENE_V7_CARD_IDS, NEW_READING_V6_CARD_IDS } from '../lib/review';

const vocab = loadVocabCatalog();
// vocab.cards / vocab.cardIndex：273 + 8 + 10 + 9 + 9 + 9，旧 id 与 alias 不变
// vocab.supplementalCards 仍只是 NEW_SCENE_CARD_IDS
// 已有各组标识含义不变；本轮新卡在 NEW_SCENE_V7_CARD_IDS / NEW_READING_V6_CARD_IDS
```

- `loadReviewCatalog()`：只给复习页。273 张卡、36 条相遇。不要把新卡塞进 `reviewEncounters`，也不要把学习/背词目录交给 `loadReviewSession`。
- `loadVocabCatalog()`：只给独立背词。可解析全部已接词卡，含释义、本课例句和另境例句。不含复习相遇，不改存储键。
- `word-session` 按适配层 id 列表校验；若改队列，可能重置那份背词会话，但不应动复习会话键，也不应覆盖场景 / 阅读记录。

## 本轮增量篇目与词数（2026-11-16 内容包实测）

下列为场景/阅读栏目下的增量篇目，不替换既有游戏、工作或其他日常内容，也不构成全站主题路径。

| 篇目 | 说明 | 规模 |
| --- | --- | --- |
| `scene-have-the-receipt` | 带小票到店里换一件合身的毛衣。 | 16 句口语，143 词 |
| `scene-ill-be-right-down` | 朋友已在楼下等候，自己找到钥匙后马上下来。 | 16 句口语，133 词 |
| `reading-elevator-is-out` | 电梯停用，提着购物袋走楼梯回家。教学建议大约 A2。 | 10 段，308 词 |
| `reading-had-to-reschedule` | 临时帮表妹搬家，只好改约，稍后仍见面。教学建议大约 A2+。 | 11 段，424 词 |

此前已接入的游戏、工作篇及既有日常篇仍在目录中，未替换。学习情景为原创学习示例，不冒充真实聊天；因未找到许可可核、适合本课的现成公开语料，故采用原创并在 provenance 标明。分级只是教学建议，未经认证。

## 明确未做

未改 `src/ui`、`App`/`main`、`package.json`、`src/lib/progress`、`src/adapters`。未在 catalog 增加主题路径或改首页。未启动新的预览服务，未跑 `vite build`。未操作真实学习数据。未接入场景 v2。未宣称实屏已验收或产品已上线。

批量导入接口与边界见 `docs/BULK_READY_IMPORT.md`。`libraryCards` 为已审校30词，不属于背词分组队列。
