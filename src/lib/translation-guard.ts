import * as Sentry from '@sentry/browser';
import { routeFamily } from './sentry';

// Machine translation in the page (Chrome's built-in translate, the Google
// Translate widget) takes text nodes out of the document and puts <font>
// elements holding the translation in their place. React still holds the
// nodes that were taken out, so when it later removes one, or inserts
// something in front of one, the browser throws NotFoundError and the screen
// falls to the error page. The app ships in two languages, so a lot of people
// read it translated, and that is what happened on the account list and on
// the signing screen.
//
// The screens avoid it where it matters: text that changes while the screen
// is open is the only child of its element, so React replaces it whole and
// the translator translates the new text, and account names, amounts and
// other data are marked translate="no". This guard is the net under that.
// For the two DOM calls that throw, a node the translator moved is handled
// the way React meant:
//
// - removing a node that is already out of the document does nothing (its
//   translation may stay on screen, which is better than no screen);
// - inserting in front of a node that is out of the document appends instead,
//   so what React adds is never lost, only possibly out of order;
// - a node the translator moved deeper (into one of its own elements) is
//   removed from, or inserted in front of, where it now is.
//
// The guard cannot tell a translator's work from anything else's: any node
// that is out of the document, or deeper inside the parent, is handled this
// way. A call that would have succeeded behaves exactly as before, and a node
// attached somewhere else entirely, or an argument that is not a node, still
// throws.

const INSTALLED = Symbol.for('hivesigner.translationGuard');

type Guarded = Node & { [INSTALLED]?: true };

function isNode(value: unknown): value is Node {
  return typeof (value as Node | null)?.nodeType === 'number';
}

/** The child of `parent` that contains `node`, or null when none does. */
function childContaining(parent: Node, node: Node): Node | null {
  let current: Node | null = node;
  while (current && current.parentNode !== parent) {
    current = current.parentNode;
  }
  return current;
}

/**
 * Patch `removeChild` and `insertBefore` on `proto` (Node.prototype unless a
 * test passes another). `onConflict` runs each time a call is rescued.
 * Returns a function that puts the original methods back. Installing twice is
 * a no-op.
 */
export function installTranslationGuard(
  onConflict: () => void = () => {},
  proto: Node = Node.prototype,
): () => void {
  const target = proto as Guarded;
  if (target[INSTALLED]) return () => {};
  const removeChild = proto.removeChild;
  const insertBefore = proto.insertBefore;

  proto.removeChild = function guardedRemoveChild<T extends Node>(
    this: Node,
    child: T,
  ): T {
    if (isNode(child) && child.parentNode !== this && child !== this) {
      if (!child.parentNode) {
        onConflict();
        return child;
      }
      if (childContaining(this, child)) {
        onConflict();
        return removeChild.call(child.parentNode, child) as T;
      }
    }
    return removeChild.call(this, child) as T;
  };

  proto.insertBefore = function guardedInsertBefore<T extends Node>(
    this: Node,
    node: T,
    ref: Node | null,
  ): T {
    if (isNode(ref) && ref.parentNode !== this && ref !== this) {
      if (!ref.parentNode) {
        onConflict();
        return insertBefore.call(this, node, null) as T;
      }
      const holder = childContaining(this, ref);
      if (holder) {
        onConflict();
        return insertBefore.call(this, node, holder) as T;
      }
    }
    return insertBefore.call(this, node, ref) as T;
  };

  Object.defineProperty(target, INSTALLED, {
    value: true,
    configurable: true,
  });
  return () => {
    proto.removeChild = removeChild;
    proto.insertBefore = insertBefore;
    delete target[INSTALLED];
  };
}

let reported = false;

/**
 * Tell error monitoring, once per page load, that the guard had to step in:
 * the page is being translated and some screen still has text React updates
 * in place. The route family says which screen. Deferred, so nothing runs in
 * the middle of React's commit.
 */
export function reportTranslationConflict(): void {
  if (reported) return;
  reported = true;
  queueMicrotask(() => {
    try {
      Sentry.captureMessage(
        `translation_conflict: ${routeFamily(window.location.pathname)}`,
        {
          level: 'warning',
          fingerprint: ['translation_conflict'],
        },
      );
    } catch {
      // Reporting must never break the page it reports on.
    }
  });
}
