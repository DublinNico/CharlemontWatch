import { render } from '@testing-library/react';
import { vi, beforeEach, describe, test, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';

vi.mock('../app/components/Footer.jsx', () => ({ default: () => null }));

import { MainLayout } from '../app/components/MainLayout';

const renderAt = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<section id="vote">vote</section>} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

// ─── Scroll handling on navigation ────────────────────────────────────────────

describe('MainLayout scrolling', () => {
  test('a valid #hash scrolls to the matching section', () => {
    renderAt('/#vote');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test('a malformed #hash falls back to the top instead of throwing', () => {
    expect(() => renderAt('/#%E0')).not.toThrow();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
