import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';

import { useScrollFade } from './use-scroll-fade';

/** Simula un contenedor de 200px de alto con `content` px de contenido. */
function mockScrollBox(el: HTMLElement, content: number) {
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 200 });
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    value: content,
  });
  el.getBoundingClientRect = () => ({ top: 0, bottom: 200 }) as DOMRect;
}

function List({ content, activeTop }: { content: number; activeTop?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFade(ref, null, []);
  return (
    <div
      data-testid="box"
      ref={(el) => {
        ref.current = el;
        if (el) mockScrollBox(el, content);
      }}
    >
      {activeTop !== undefined && (
        <a
          aria-current="page"
          ref={(el) => {
            if (el)
              el.getBoundingClientRect = () =>
                ({ top: activeTop, bottom: activeTop + 28 }) as DOMRect;
          }}
        >
          Activo
        </a>
      )}
    </div>
  );
}

describe('useScrollFade', () => {
  it('no marca difuminado cuando todo el contenido cabe', () => {
    const { getByTestId } = render(<List content={200} />);
    const box = getByTestId('box');
    expect(box.hasAttribute('data-fade-top')).toBe(false);
    expect(box.hasAttribute('data-fade-bottom')).toBe(false);
  });

  it('marca el borde inferior al desbordar y el superior al hacer scroll', () => {
    const { getByTestId } = render(<List content={600} />);
    const box = getByTestId('box');
    expect(box.hasAttribute('data-fade-top')).toBe(false);
    expect(box.hasAttribute('data-fade-bottom')).toBe(true);

    box.scrollTop = 150;
    fireEvent.scroll(box);
    expect(box.hasAttribute('data-fade-top')).toBe(true);
    expect(box.hasAttribute('data-fade-bottom')).toBe(true);

    box.scrollTop = 400;
    fireEvent.scroll(box);
    expect(box.hasAttribute('data-fade-top')).toBe(true);
    expect(box.hasAttribute('data-fade-bottom')).toBe(false);
  });

  it('desplaza el contenedor hasta dejar visible el ítem activo', () => {
    const { getByTestId } = render(<List content={600} activeTop={500} />);
    // 500 + 28 - 200 + 8 de margen
    expect(getByTestId('box').scrollTop).toBe(336);
  });
});
