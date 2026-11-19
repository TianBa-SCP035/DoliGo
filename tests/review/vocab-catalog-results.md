# 独立背词目录 loadVocabCatalog · 测试输出

时间：2026-11-12T16:44:28+08:00（Asia/Shanghai，UTC+8）
机器：DESKTOP-DAHN9T1
项目：C:/Users/TianBa/Test_Factory/多莉国重构
未启动预览服务，未跑 vite build，未操作真实学习记录。

## tsc --noEmit

命令：`npx --yes tsc --noEmit`
结果：通过（exit 0）。

## vitest tests/review

命令：`npx --yes vitest run tests/review`
结果：9 files / 55 tests passed，其中 `vocab-catalog.test.ts` 4 项通过。
时长：1.74s（vitest 3.2.7）

## 本轮变更文件

- src/lib/review/catalog.ts（新增 loadVocabCatalog）
- src/lib/review/types.ts（追加 VocabCatalog）
- src/lib/review/index.ts（追加导出）
- src/lib/review/LEARNING_CATALOG.md
- src/lib/review/README.md
- tests/review/vocab-catalog.test.ts
- tests/review/vocab-catalog-results.md

未改：src/ui、App/main、package、src/lib/progress、src/adapters、src/lib/review/content.ts、session.ts、旧 JSON 包。
