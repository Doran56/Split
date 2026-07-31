import { roundToNearest } from '../locale';

describe('roundToNearest', () => {
  it('rounds to the nearest multiple of the given step', () => {
    expect(roundToNearest(487, 10)).toBe(490);
    expect(roundToNearest(483, 10)).toBe(480);
    expect(roundToNearest(1000, 10)).toBe(1000);
    expect(roundToNearest(0, 10)).toBe(0);
  });
});
