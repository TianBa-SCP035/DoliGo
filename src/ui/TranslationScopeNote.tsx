import React from "react";
/** Honest copy for local glosses versus online translation. Not a translator. */
export function TranslationScopeNote() {
  return (
    <aside className="doli-translation-scope" aria-label="查译范围">
      <p>
        当前可以按需查看已整理文章里的整句、整段中文，也可以点预置词或划到本地词库里的词看释义。
      </p>
      <ul>
        <li>预置词：打开教材词卡。</li>
        <li>划选命中本文说明或本地词库：显示对应释义，并标明来源。</li>
        <li>词库没有的选词：不编造释义，可改看已对齐的整句或整段中文。</li>
        <li>
          任意文本在线翻译：尚未接入，不会在这里自动译出词库外的任意片段。
        </li>
      </ul>
      <p className="doli-muted">查词、看译文或做对练习，都不会自动标记为已掌握。</p>
    </aside>
  );
}
