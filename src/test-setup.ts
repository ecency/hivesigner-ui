import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
// Initialize i18next once for component tests that call useTranslation.
import './i18n';

// Several tests wait on a real key derivation (scrypt, deliberately slow),
// which takes seconds on a loaded machine or a slow CI runner. The default
// 1s for findBy/waitFor made them fail there with nothing wrong; a wait that
// succeeds returns as soon as it does, so a long ceiling costs nothing.
configure({ asyncUtilTimeout: 10_000 });
