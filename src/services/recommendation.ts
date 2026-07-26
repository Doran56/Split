import type { Recommendation } from '../types/budget';
import { clamp, round1 } from './locale';

export interface HabitInput {
  income: number;
  currentEssentialSpend: number;
  currentLeisureSpend: number;
}

const CLASSIC = { essential: 50, leisure: 30, investment: 20 };
/** On ne recommande jamais un taux d'investissement inférieur à la règle classique. */
const MIN_INVESTMENT = CLASSIC.investment;
/** Marge de sécurité ajoutée au-dessus du ratio essentiel observé, pour rester réaliste. */
const ESSENTIAL_BUFFER = 5;

/**
 * Corrige la dérive d'arrondi flottant en ajoutant le résidu à la plus grande valeur,
 * pour garantir que essential + leisure + investment somme toujours exactement à 100.
 */
function fixRoundingDrift(parts: Recommendation): Recommendation {
  const sum = round1(parts.essential + parts.leisure + parts.investment);
  const residual = round1(100 - sum);
  if (residual === 0) return parts;

  const keys: (keyof Pick<Recommendation, 'essential' | 'leisure' | 'investment'>)[] = [
    'essential',
    'leisure',
    'investment',
  ];
  const largestKey = keys.reduce((a, b) => (parts[b] > parts[a] ? b : a));
  return { ...parts, [largestKey]: round1(parts[largestKey] + residual) };
}

export function recommendAllocation({ income, currentEssentialSpend, currentLeisureSpend }: HabitInput): Recommendation {
  if (income <= 0) {
    return { ...CLASSIC, message: '' };
  }

  const essentialRatio = clamp((currentEssentialSpend / income) * 100, 0, 100);
  const leisureRatio = clamp((currentLeisureSpend / income) * 100, 0, 100 - essentialRatio);
  const currentInvestRatio = round1(100 - essentialRatio - leisureRatio);

  const hasRoom = essentialRatio <= CLASSIC.essential;
  const targetEssential = round1(hasRoom ? Math.min(essentialRatio + ESSENTIAL_BUFFER, CLASSIC.essential) : essentialRatio);

  const desiredInvestment = Math.max(MIN_INVESTMENT, currentInvestRatio);
  const roomForLeisureAndInvestment = clamp(round1(100 - targetEssential), 0, 100);
  const investment = round1(Math.min(desiredInvestment, roomForLeisureAndInvestment));
  const leisure = round1(Math.max(roomForLeisureAndInvestment - investment, 0));

  const result = fixRoundingDrift({ essential: targetEssential, leisure, investment, message: '' });

  const message = hasRoom
    ? `Vos dépenses essentielles sont sous ${CLASSIC.essential}% de votre revenu : nous vous proposons d'investir ${result.investment}% pour accélérer votre épargne.`
    : investment >= desiredInvestment
      ? `Vos charges essentielles sont élevées : nous vous suggérons de limiter les loisirs à ${result.leisure}% pour maintenir ${result.investment}% d'investissement.`
      : `Vos charges essentielles sont très élevées : même en réduisant les loisirs, nous ne pouvons vous proposer que ${result.investment}% d'investissement pour l'instant.`;

  return { ...result, message };
}
