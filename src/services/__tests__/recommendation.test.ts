import { recommendAllocation } from '../recommendation';

function sum(r: { essential: number; leisure: number; investment: number }) {
  return Math.round((r.essential + r.leisure + r.investment) * 10) / 10;
}

describe('recommendAllocation', () => {
  it('always sums to exactly 100', () => {
    const cases = [
      { income: 2000, currentEssentialSpend: 1000, currentLeisureSpend: 600 },
      { income: 2000, currentEssentialSpend: 400, currentLeisureSpend: 300 },
      { income: 2000, currentEssentialSpend: 1900, currentLeisureSpend: 50 },
      { income: 2000, currentEssentialSpend: 1800, currentLeisureSpend: 100 },
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

  it('never recommends investing less than the current investment rate', () => {
    // Income 2000, essential 400 (20%), leisure 300 (15%) -> already investing 65% today
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 400, currentLeisureSpend: 300 });
    expect(result.investment).toBeGreaterThanOrEqual(65);
  });

  it('never recommends investing less than the classic 20% floor when there is room', () => {
    // Comfortable budget: essential well under 50%, currently investing nothing
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 600, currentLeisureSpend: 1400 });
    expect(result.investment).toBeGreaterThanOrEqual(20);
  });

  it('caps essential spend recommendation at the actual ratio when costs already exceed 50%', () => {
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 1600, currentLeisureSpend: 200 });
    expect(result.essential).toBe(80);
  });

  it('degrades investment below the classic floor rather than breaking the 100% total when essential costs are extreme', () => {
    const result = recommendAllocation({ income: 2000, currentEssentialSpend: 1900, currentLeisureSpend: 50 });
    expect(result.essential).toBe(95);
    expect(sum(result)).toBe(100);
    expect(result.investment).toBeLessThan(20);
  });

  it('falls back to the classic 50/30/20 split when income is zero or negative', () => {
    const result = recommendAllocation({ income: 0, currentEssentialSpend: 0, currentLeisureSpend: 0 });
    expect(result).toMatchObject({ essential: 50, leisure: 30, investment: 20 });
  });
});
