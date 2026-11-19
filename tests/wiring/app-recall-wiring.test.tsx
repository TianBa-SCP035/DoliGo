import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../../src/App';
import { RECALL_SPACING_KEY } from '../../src/adapters/memory-spacing';
import { REFACTOR_STORAGE_KEY } from '../../src/lib/progress/types';

let root: Root;
let host: HTMLDivElement;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const JUBAN = 'juban.user-data.v1';
const REVIEW_SESSION_KEY = 'doliguo:refactor:sandbox:review-session:v1';
const TRAVEL_SCENE = 'scene-next-bus-delayed';
const LUNCH = 'reading-lunch-later';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = '/';
  host = document.createElement('div');
  document.body.append(host);
  HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
});

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
});

function renderApp() {
  act(() => {
    root = createRoot(host);
    root.render(<App />);
  });
}

async function settle(frames = 6) {
  for (let i = 0; i < frames; i++) {
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    });
  }
}

function click(label: string) {
  const button = Array.from(host.querySelectorAll('button')).find((btn) =>
    btn.textContent?.includes(label),
  );
  expect(button, `missing button: ${label}`).toBeTruthy();
  act(() => button!.click());
}

function seedProtectedKeys() {
  localStorage.setItem(JUBAN, '{"keep":"real"}');
  localStorage.setItem(REFACTOR_STORAGE_KEY, '{"keep":true}');
  localStorage.setItem(REVIEW_SESSION_KEY, '{"keep":"review"}');
}

function expectProtectedKeysIntact() {
  expect(localStorage.getItem(JUBAN)).toBe('{"keep":"real"}');
  expect(localStorage.getItem(REVIEW_SESSION_KEY)).toBe('{"keep":"review"}');
  expect(JSON.stringify(localStorage.getItem(REFACTOR_STORAGE_KEY))).not.toMatch(
    /mastery/,
  );
}

describe('App recall wiring', () => {
  it('passes three recall buttons on a study card and records only the spacing key', () => {
    seedProtectedKeys();
    location.hash = '#/words/basic';
    renderApp();
    const labels = Array.from(host.querySelectorAll('button')).map((button) => button.textContent ?? '');
    expect(labels.some((text) => text.includes('完全不记得'))).toBe(true);
    expect(labels.some((text) => text.includes('有点印象'))).toBe(true);
    expect(labels.some((text) => text.includes('我记得'))).toBe(true);
    expect(labels.some((text) => text.includes('还要再看'))).toBe(false);
    expect(labels.some((text) => text.includes('这张先这样'))).toBe(false);
    click('完全不记得');
    expectProtectedKeysIntact();
    const sandbox = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY) ?? '{}') as {
      kind?: string;
      wordSession?: { ids?: string[]; index?: number };
    };
    expect(sandbox.kind).toBe('doliguo-refactor-sandbox');
    expect(sandbox.wordSession?.index).toBe(1);
    expect(JSON.stringify(sandbox)).not.toMatch(/mastery/);
    const stored = JSON.parse(localStorage.getItem(RECALL_SPACING_KEY) ?? '{}') as {
      targets?: Record<string, { rating?: string }>;
    };
    expect(stored.targets?.['L01-V01']?.rating).toBe('forgotten');
    expect(JSON.stringify(stored)).not.toMatch(/mastery/);
  });

  it('shows rated due words on the review entrance without the old ReviewView cards', () => {
    location.hash = '#/words/basic';
    renderApp();
    click('完全不记得');
    const spacing = JSON.parse(localStorage.getItem(RECALL_SPACING_KEY) ?? '{}') as {
      targets?: Record<string, { nextDueAt?: number }>;
    };
    if (spacing.targets?.['L01-V01']) {
      spacing.targets['L01-V01'].nextDueAt = Date.now() - 1000;
      localStorage.setItem(RECALL_SPACING_KEY, JSON.stringify(spacing));
    }
    act(() => {
      location.hash = '#/review';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(host.textContent).toContain('现在可以复习');
    expect(host.textContent).toMatch(/到期/);
    expect(host.querySelector('.doli-review-due')).toBeTruthy();
    expect(host.querySelector('.doli-review')).toBeNull();
    expect(host.querySelector('#review-title')).toBeNull();
    expect(host.textContent).not.toContain('这一义还不太熟');
    expect(host.textContent).not.toContain('这句里的意思，我还记得');
    expect(host.textContent).not.toContain('下一条');
    click('tired');
    expect(location.hash).toBe('#/words/card/L01-V01');
    expect(host.querySelector('.doli-word-panel')).toBeTruthy();
    expect(host.textContent).toMatch(/\btired\b/);
    expect(host.textContent).toMatch(/1\s*\/\s*1/);
    expect(host.textContent).not.toMatch(/2\s*\/\s*8/);
    const panel = host.querySelector('.doli-word-panel');
    expect(panel?.textContent).toMatch(/\btired\b/);
    expect(panel?.textContent ?? '').not.toMatch(/2\s*\/\s*8/);
    expect(host.textContent).toContain('完全不记得');
    expect(host.textContent).toContain('有点印象');
    expect(host.textContent).toContain('我记得');
    expect(host.textContent).not.toContain('这一义还不太熟');
    const sandbox = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY) ?? '{}') as {
      wordSession?: { index?: number };
    };
    expect(sandbox.wordSession?.index).toBe(1);
  });

  it('keeps group resume when opening the group from the words entrance', () => {
    location.hash = '#/words/basic';
    renderApp();
    click('完全不记得');
    const sandbox = JSON.parse(localStorage.getItem(REFACTOR_STORAGE_KEY) ?? '{}') as {
      wordSession?: { index?: number };
    };
    expect(sandbox.wordSession?.index).toBe(1);
    act(() => {
      location.hash = '#/words/basic';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(location.hash).toBe('#/words/basic');
    expect(host.textContent).toMatch(/\bfine\b/);
    expect(host.textContent).toMatch(/2\s*\/\s*8/);
    expect(host.textContent).not.toMatch(/1\s*\/\s*1/);
  });

  it('passes sentence recall on a scene and records only the sandbox spacing key', async () => {
    seedProtectedKeys();
    location.hash = `#/scenes/${TRAVEL_SCENE}`;
    renderApp();
    await settle();
    expect(host.textContent).toContain('完全不记得');
    expect(host.textContent).toContain('有点印象');
    expect(host.textContent).toContain('我记得');
    expect(host.textContent).toContain('选一个就进入下一句');
    expect(host.textContent).toContain('跳过，先看下一句');
    expect(host.textContent).not.toContain('可选练习');
    expect(host.textContent).not.toMatch(/发音|播放/);
    const translation = host.querySelector('details.doli-translation');
    expect(translation).toBeTruthy();
    act(() => {
      (translation as HTMLDetailsElement).open = true;
      translation!.dispatchEvent(new Event('toggle', { bubbles: true }));
    });
    expect(localStorage.getItem(RECALL_SPACING_KEY)).toBeNull();
    const unitIds = Array.from(
      host.querySelectorAll<HTMLElement>('[data-progress-unit]'),
    ).map((node) => node.dataset.progressUnit);
    expect(unitIds.length).toBeGreaterThan(1);
    click('我记得');
    expectProtectedKeysIntact();
    const stored = JSON.parse(localStorage.getItem(RECALL_SPACING_KEY) ?? '{}') as {
      targets?: Record<string, { rating?: string }>;
    };
    expect(stored.targets?.[unitIds[0] ?? '']?.rating).toBe('remembered');
    expect(stored.targets?.[TRAVEL_SCENE]).toBeUndefined();
    expect(JSON.stringify(stored)).not.toMatch(/mastery/);
    expect(
      host.querySelector<HTMLElement>('[data-current-unit]')?.dataset.progressUnit,
    ).toBe(unitIds[1]);
    expect(host.textContent).toContain('完全不记得');
    expect(location.hash).toBe(`#/scenes/${TRAVEL_SCENE}`);
  });

  it('passes sentence recall on a reading; skip does not write a rating', async () => {
    seedProtectedKeys();
    location.hash = `#/reading/${LUNCH}`;
    renderApp();
    await settle();
    expect(host.textContent).toContain('完全不记得');
    expect(host.textContent).not.toContain('可选练习');
    const unitIds = Array.from(
      host.querySelectorAll<HTMLElement>('[data-progress-unit]'),
    ).map((node) => node.dataset.progressUnit);
    expect(unitIds.length).toBeGreaterThan(1);
    click('跳过，先看下一段');
    expectProtectedKeysIntact();
    expect(localStorage.getItem(RECALL_SPACING_KEY)).toBeNull();
    expect(
      host.querySelector<HTMLElement>('[data-current-unit]')?.dataset.progressUnit,
    ).toBe(unitIds[1]);
    expect(location.hash).toBe(`#/reading/${LUNCH}`);
    for (let i = 1; i < unitIds.length; i++) {
      click('跳过，先看下一段');
    }
    expect(host.querySelector('[data-recall-complete]')).toBeTruthy();
    expect(host.textContent).toContain('已经到最后一段了');
    expect(host.textContent).not.toContain('已经到最后一句了');
    expect(host.querySelector('h1')).toBeTruthy();
    expect(host.textContent).not.toContain('完全不记得');
    expect(location.hash).toBe(`#/reading/${LUNCH}`);
  });
});
