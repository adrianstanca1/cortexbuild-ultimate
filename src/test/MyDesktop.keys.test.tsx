import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MyDesktop } from '../components/modules/MyDesktop';

describe('MyDesktop calculator keys', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not emit duplicate key warnings when opening calculator', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MyDesktop />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.click(screen.getByRole('button', { name: 'Calculator' }));

    const hasDuplicateKeyWarning = errorSpy.mock.calls.some((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('Encountered two children with the same key'))
    );

    expect(hasDuplicateKeyWarning).toBe(false);
  });
});
