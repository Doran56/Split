import type { Recommendation } from '../types/budget';
import { clamp, round1 } from './locale';

export interface HabitInput {
  income: number;
  currentEssentialSpend: number;
  currentLeisureSpend: number;
}

const FALLBACK = { essential: 50, leisure: 30, investment: 20 };
/** Bande cible pour les loisirs : jamais plus de 30%, jamais moins de 20% si le budget le permet. */
const MIN_LEISURE = 20;
const MAX_LEISURE = 30;

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

/**
 * Les dépenses essentielles sont fixes : la recommandation reflète le ratio réel observé,
 * sans marge ni plafond artificiel — ce sont de vraies charges, pas un objectif ajustable.
 * Les loisirs sont bornés entre 20% et 30% du revenu, sauf si le budget restant après
 * l'essentiel ne le permet pas ("si possible"), auquel cas ils absorbent ce qu'il reste.
 * L'investissement reçoit systématiquement le reliquat (100 - essentiel - loisirs).
 */
export function recommendAllocation({ income, currentEssentialSpend, currentLeisureSpend }: HabitInput): Recommendation {
  if (income <= 0) {
    return { ...FALLBACK, message: '' };
  }

  const essential = round1(clamp((currentEssentialSpend / income) * 100, 0, 100));
  const room = round1(clamp(100 - essential, 0, 100));

  // Le ratio brut (non borné par la place disponible) sert à déterminer l'objectif dans la
  // bande 20-30% ; la disponibilité réelle (room) n'intervient qu'ensuite, pour le message.
  const rawLeisureRatio = clamp((currentLeisureSpend / income) * 100, 0, 100);
  const leisureTarget = clamp(rawLeisureRatio, MIN_LEISURE, MAX_LEISURE);
  const leisure = round1(clamp(leisureTarget, 0, room));
  const investment = round1(Math.max(room - leisure, 0));

  const result = fixRoundingDrift({ essential, leisure, investment, message: '' });

  const message =
    result.leisure < MIN_LEISURE
      ? `Vos dépenses essentielles représentent ${result.essential}% de votre revenu : il ne reste que ${result.leisure}% pour les loisirs, sous le plancher de ${MIN_LEISURE}% habituel. Investissement : ${result.investment}%.`
      : result.leisure < leisureTarget
        ? `Vos dépenses essentielles représentent ${result.essential}% de votre revenu : nous limitons les loisirs à ${result.leisure}% pour maximiser l'investissement à ${result.investment}%.`
        : `Vos dépenses essentielles représentent ${result.essential}% de votre revenu : nous vous proposons ${result.leisure}% pour les loisirs (entre ${MIN_LEISURE} et ${MAX_LEISURE}%) et ${result.investment}% pour l'investissement.`;

  return { ...result, message };
}
