import { recommendAllocation } from '../recommendation';

function sum(r: { essential: number; leisure: number; investment: number }) {
  return Math.round((r.essential + r.leisure + r.investment) * 10) / 10;
}

describe('recommendAllocation', () => {
  it('always sums to exactly 100 and never goes negative', () => {
    const cases = [
      { income: 2000, currentEssentialSpend: 1000, currentLeisureSpend: 300 },
      { income: 2000, currentEssentialSpend: 400, currentLeisureSpend: 700 },
      { income: 2000, currentEssentialSpend: 1900, currentLeisureSpend: 50 },
      { income: 2000, currentEssentialSpend: 1700, currentLeisureSpend: 100 },
      { income: 3000, currentEssentialSpend: 0, currentLeisureSpend: 0 },
      { income: 1500, currentEssentialSpend: 1500, currentLeisureSpend: 0 },
      { income: 0, currentEssentialSpend: 0, currentLeisureSpend: 0 },
    ];
    for (const input of cases) {
      const result = recommendAllocation(input);
      expect(sum(result)).toBe(100);
      expect(result.essential).toBeGreaterThanOrEqual(0);
      expect(result.leisure).toBeGreaterThanOrEqual(0);
      expect(result.investment).toBeGreaterThanOrEqual(0);
    }
  });

  it('treats essential as a fixed pass-through of the actual ratio, no buffer or cap', () => {
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 1600, currentLeisureSpend: 200 });
    expect(result.essential).toBe(80);
  });

  it('pulls leisure up to the 20% floor when current habits are below it and there is room', () => {
    // essential 50% (room 50%), leisure habit only 15% -> floored to 20%
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 1000, currentLeisureSpend: 300 });
    expect(result.essential).toBe(50);
    expect(result.leisure).toBe(20);
    expect(result.investment).toBe(30);
  });

  it('caps leisure at the 30% ceiling even when current habits spend much more', () => {
    // essential 20% (room 80%), leisure habit 35% -> capped to 30%
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 400, currentLeisureSpend: 700 });
    expect(result.essential).toBe(20);
    expect(result.leisure).toBe(30);
    expect(result.investment).toBe(50);
  });

  it('lets leisure absorb whatever room remains, below the 20% floor, when essential costs leave no choice', () => {
    // essential 95% -> only 5% left at all, nowhere near the 20% floor
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 1900, currentLeisureSpend: 50 });
    expect(result.essential).toBe(95);
    expect(result.leisure).toBe(5);
    expect(result.investment).toBe(0);
  });

  it('caps leisure below its target but still within the floor when room is tight but >= 20%', () => {
    // essential 75% -> room 25%; habit-based target would be 30% (capped), but only 25% fits
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 1500, currentLeisureSpend: 700 });
    expect(result.essential).toBe(75);
    expect(result.leisure).toBe(25);
    expect(result.investment).toBe(0);
    expect(result.message).toContain('limitons les loisirs');
  });

  it('falls back to the classic 50/30/20 split when income is zero or negative', () => {
    const result = recommendAllocation({ income: 0, currentEssentialSpend: 0, currentLeisureSpend: 0 });
    expect(result).toMatchObject({ essential: 50, leisure: 30, investment: 20 });
  });
});
