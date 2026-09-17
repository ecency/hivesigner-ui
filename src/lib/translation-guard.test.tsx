import { act, render } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock('@sentry/browser', () => sentry);

import { installTranslationGuard } from './translation-guard';

/** What a page translator does to a text node: swap it for its own element. */
function translate(text: Text): HTMLElement {
  const font = document.createElement('font');
  font.textContent = `«${text.nodeValue}»`;
  text.parentNode?.replaceChild(font, text);
  return font;
}

/** The name of the error `run` throws, or `none`. */
function thrown(run: () => unknown): string {
  try {
    run();
  } catch (e) {
    return (e as DOMException).name;
  }
  return 'none';
}

function textIn(el: Element): Text {
  const node = Array.from(el.childNodes).find(
    (n) => n.nodeType === Node.TEXT_NODE,
  );
  if (!node) throw new Error('no text node');
  return node as Text;
}

let uninstall: () => void = () => {};
let conflicts = 0;

afterEach(() => {
  uninstall();
  uninstall = () => {};
  conflicts = 0;
});

function guard() {
  uninstall = installTranslationGuard(() => {
    conflicts += 1;
  });
}

describe('the DOM calls React makes, on a node a translator moved', () => {
  let parent: HTMLDivElement;
  let text: Text;
  beforeEach(() => {
    parent = document.createElement('div');
    parent.append('Protected');
    text = textIn(parent);
  });

  it('throw without the guard, which is the crash users saw', () => {
    translate(text);
    expect(thrown(() => parent.removeChild(text))).toBe('NotFoundError');
    expect(
      thrown(() => parent.insertBefore(document.createElement('span'), text)),
    ).toBe('NotFoundError');
  });

  it('removing a node already taken out does nothing and says so', () => {
    guard();
    const font = translate(text);
    expect(parent.removeChild(text)).toBe(text);
    // The translation stays: the guard cannot know it stood for this node.
    expect(Array.from(parent.childNodes)).toEqual([font]);
    expect(conflicts).toBe(1);
  });

  it('inserting in front of a node taken out appends, never drops', () => {
    guard();
    const font = translate(text);
    const badge = document.createElement('span');
    expect(parent.insertBefore(badge, text)).toBe(badge);
    expect(Array.from(parent.childNodes)).toEqual([font, badge]);
    expect(conflicts).toBe(1);
  });

  it('a node moved deeper is removed from, or inserted before, where it is', () => {
    guard();
    // A translator that wraps the original node instead of replacing it.
    const wrapper = document.createElement('font');
    parent.replaceChild(wrapper, text);
    wrapper.append(text);
    const badge = document.createElement('span');
    parent.insertBefore(badge, text);
    expect(Array.from(parent.childNodes)).toEqual([badge, wrapper]);
    parent.removeChild(text);
    expect(wrapper.childNodes).toHaveLength(0);
    expect(text.parentNode).toBeNull();
    expect(conflicts).toBe(2);
  });

  it('a node attached somewhere else entirely still throws', () => {
    guard();
    const elsewhere = document.createElement('div');
    const stranger = document.createElement('p');
    elsewhere.append(stranger);
    expect(thrown(() => parent.removeChild(stranger))).toBe('NotFoundError');
    expect(
      thrown(() =>
        parent.insertBefore(document.createElement('span'), stranger),
      ),
    ).toBe('NotFoundError');
    // Nor may a node be removed from, or inserted in front of, itself.
    expect(thrown(() => parent.removeChild(parent))).toBe('NotFoundError');
    expect(
      thrown(() => parent.insertBefore(document.createElement('span'), parent)),
    ).toBe('NotFoundError');
    expect(stranger.parentNode).toBe(elsewhere);
    expect(conflicts).toBe(0);
  });

  it('leaves an argument that is not a node to the browser to refuse', () => {
    guard();
    const notNodes: unknown[] = [{}, 'x', { parentNode: null }];
    for (const value of notNodes) {
      expect(thrown(() => parent.removeChild(value as Node))).toBe('TypeError');
      expect(
        thrown(() =>
          parent.insertBefore(document.createElement('span'), value as Node),
        ),
      ).toBe('TypeError');
    }
    expect(Array.from(parent.childNodes)).toEqual([text]);
    expect(conflicts).toBe(0);
  });

  it('changes nothing for calls that were fine', () => {
    guard();
    const badge = document.createElement('span');
    parent.insertBefore(badge, text);
    expect(Array.from(parent.childNodes)).toEqual([badge, text]);
    const tail = document.createElement('b');
    parent.insertBefore(tail, null);
    expect(parent.lastChild).toBe(tail);
    expect(parent.removeChild(text)).toBe(text);
    expect(Array.from(parent.childNodes)).toEqual([badge, tail]);
    expect(conflicts).toBe(0);
  });

  it('installs once, and uninstalling restores the originals', () => {
    const { insertBefore, removeChild } = Node.prototype;
    guard();
    const second = installTranslationGuard(() => {
      throw new Error('a second guard must not be installed');
    });
    translate(text);
    parent.removeChild(text);
    expect(conflicts).toBe(1);
    second();
    expect(Node.prototype.removeChild).not.toBe(removeChild);
    uninstall();
    uninstall = () => {};
    expect(Node.prototype.insertBefore).toBe(insertBefore);
    expect(Node.prototype.removeChild).toBe(removeChild);
  });
});

// The account row that crashed: a "Current" badge that appears in front of
// the status text, after the translator replaced that text.
function StatusLine({ current }: { current: boolean }) {
  return (
    <div data-testid="line">
      {current && <span>Current</span>}
      {'Protected'}
    </div>
  );
}

class Boundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <p role="alert">{this.state.error.name}</p>
    ) : (
      this.props.children
    );
  }
}

describe('React on a translated page', () => {
  function renderTranslated() {
    const view = render(
      <Boundary>
        <StatusLine current={false} />
      </Boundary>,
    );
    translate(textIn(view.getByTestId('line')));
    return view;
  }

  it('crashes without the guard', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = renderTranslated();
    act(() =>
      view.rerender(
        <Boundary>
          <StatusLine current />
        </Boundary>,
      ),
    );
    expect(view.getByRole('alert').textContent).toBe('NotFoundError');
    vi.mocked(console.error).mockRestore();
  });

  it('keeps rendering with it, and the new element is on screen', () => {
    guard();
    const view = renderTranslated();
    act(() =>
      view.rerender(
        <Boundary>
          <StatusLine current />
        </Boundary>,
      ),
    );
    expect(view.queryByRole('alert')).toBeNull();
    expect(view.getByTestId('line').textContent).toBe('«Protected»Current');
    act(() =>
      view.rerender(
        <Boundary>
          <StatusLine current={false} />
        </Boundary>,
      ),
    );
    expect(view.getByTestId('line').textContent).toBe('«Protected»');
    expect(conflicts).toBe(1);
  });
});

describe('reportTranslationConflict', () => {
  beforeEach(() => {
    sentry.captureMessage.mockClear();
    vi.resetModules();
  });

  it('reports once per page load, with the screen it happened on', async () => {
    const { reportTranslationConflict } = await import('./translation-guard');
    window.history.replaceState(
      null,
      '',
      '/accounts?next=%2Fsign%2Fop%2Fsecret',
    );
    reportTranslationConflict();
    reportTranslationConflict();
    await Promise.resolve();
    expect(sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'translation_conflict: accounts',
      { level: 'warning', fingerprint: ['translation_conflict'] },
    );
    window.history.replaceState(null, '', '/');
  });

  it('never lets a reporting failure reach the page', async () => {
    sentry.captureMessage.mockImplementationOnce(() => {
      throw new Error('reporting is down');
    });
    const { reportTranslationConflict } = await import('./translation-guard');
    expect(() => reportTranslationConflict()).not.toThrow();
    // The report runs as a microtask; a throw escaping it would fail the run.
    await Promise.resolve();
    expect(sentry.captureMessage).toHaveBeenCalledTimes(1);
  });
});
