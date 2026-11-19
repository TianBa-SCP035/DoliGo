# 共享教学内容

本目录只放当前接入用的教学内容，不是已上线页面。不要用旧 builder 覆盖这里的 v1.1 / v1.2 / v2.1 / v4 文件。`everyday-scenes-pack-v3` 是增量补充，不替换 v1.1；`everyday-scenes-pack-v2` 仍未接入，不要默默上线。

| 文件 | 用途 |
| --- | --- |
| `independent-vocab-review-pack-v1.2.json` | 273 张词卡索引 + 36 条复习相遇（wait 词卡例句已去重；当前接入用） |
| `independent-vocab-review-pack-v1.1.json` | 上一版复习索引，保留备查 |
| `content-text-anchors-v1.1.json` | 已接入场景 v1.1 / 阅读 / 复习句的可点范围 |
| `content-text-anchors-scenes-v3.json` | 场景 v3 补充点词范围；通过 `loadLearningCatalog()` 合并，不替换 v1.1 |
| `english-foundation-8-lessons.json` | 基础八课原文 |
| `english-expansion-everyday-v4.json` | 扩展 v4 原文（不要整包改写成 v4.1） |
| `english-expansion-everyday-v4.1-patch.json` | 只补 `v4-transfer-16` 的句级目标 |
| `everyday-scenes-pack-v1.1.json` | 已接入的两段场景对话原文 |
| `everyday-scenes-pack-v3.json` | 增量两段场景（约饭改时间、商店缺货替代）；不替换 v1.1 |
| `everyday-scenes-pack-v4.json` | 增量两段场景（游戏语音听不清、请同事再试表格）；不替换 v1.1/v3 |
| `everyday-scenes-pack-v5.json` | 日常交流增量场景（公交晚点改乘火车、餐馆客满改去街角）；不替换既有场景包 |
| `everyday-scenes-pack-v6.json` | 增量两段场景（快递在门口、这杯不是我的）；不替换既有场景包 |
| `everyday-scenes-pack-v7.json` | 增量两段场景（有小票吗、我马上下来）；不替换既有场景包 |
| `everyday-reading-pack-v2.1.json` | 已接入的分级阅读原文 |
| `everyday-reading-pack-v3.json` | 增量两篇阅读（周末计划变化、找对楼层）；不替换 v2.1 |
| `everyday-reading-pack-v4.json` | 日常交流增量阅读（雨里的野餐计划、坐过了站）；不替换 v2.1/v3 |
| `everyday-reading-pack-v5.json` | 增量两篇阅读（充电器没带、邻居先帮收了）；不替换既有阅读包 |
| `everyday-reading-pack-v6.json` | 增量两篇阅读（电梯坏了、改约了时间）；不替换既有阅读包 |
| `sourced-reading-pack-wikivoyage-v1.json` | 外部改编一篇阅读（到达一座新城市，CC BY-SA 4.0）；无词卡、无锚点，不替换既有阅读包 |
| `content-text-anchors-scenes-v6.json` | 场景 v6 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-scenes-v7.json` | 场景 v7 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-reading-v5.json` | 阅读 v5 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-reading-v6.json` | 阅读 v6 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-scenes-v5.json` | 场景 v5 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-reading-v4.json` | 阅读 v4 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-scenes-v4.json` | 场景 v4 补充点词范围；合并接入，不替换旧锚点 |
| `content-text-anchors-reading-v3.json` | 阅读 v3 补充点词范围；合并接入，不替换旧锚点 |
| `manifest.ts` | 文件、版本和 SHA-256 |

复习入口仍用 `loadReviewCatalog()`（273 张卡、36 条相遇、v1.1 锚点）。场景/阅读合并目录用 `loadLearningCatalog()`，`catalog.readings` 含全部已接阅读。查看释义或例句不记为掌握。`everyday-scenes-pack-v2` 仍未接入。
