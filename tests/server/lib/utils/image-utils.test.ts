import { describe, it, expect } from 'vitest';
import { estimateBase64Size } from '../../../../server/lib/utils/image-utils';

describe('estimateBase64Size', () => {
  it('should return 0 for an empty string', () => {
    expect(estimateBase64Size('')).toBe(0);
  });

  it('should correctly estimate size of a base64 string with no padding', () => {
    // "Man" -> "TWFu" (3 bytes encoded as 4 chars)
    expect(estimateBase64Size('TWFu')).toBe(3);
  });

  it('should correctly estimate size of a base64 string with 1 padding character', () => {
    // "Ma" -> "TWE=" (2 bytes encoded as 4 chars)
    expect(estimateBase64Size('TWE=')).toBe(2);
  });

  it('should correctly estimate size of a base64 string with 2 padding characters', () => {
    // "M" -> "TQ==" (1 byte encoded as 4 chars)
    expect(estimateBase64Size('TQ==')).toBe(1);
  });

  it('should estimate larger strings correctly', () => {
    // Repeating "Man" 10 times -> 30 bytes
    // "TWFu" repeated 10 times = 40 chars
    const base64Data = 'TWFu'.repeat(10);
    expect(estimateBase64Size(base64Data)).toBe(30);
  });
});
