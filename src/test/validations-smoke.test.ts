import { describe, it, expect } from 'vitest';
import { rfiSchema } from '../lib/validations';
import { validateNotification } from '../lib/validateNotification';

describe('validations smoke', () => {
  it('parses a minimal RFI payload', () => {
    const parsed = rfiSchema.parse({
      number: 'RFI-1',
      subject: 'Clarification',
      question: 'What is the ceiling height?',
    });
    expect(parsed.number).toBe('RFI-1');
    expect(parsed.status).toBe('open');
  });

  it('validateNotification returns null for invalid payload', () => {
    expect(validateNotification({})).toBeNull();
  });
});
