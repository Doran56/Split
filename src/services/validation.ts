import { z } from 'zod';
import { parseLocaleNumber } from './locale';

const localeAmount = (message: string) =>
  z
    .string()
    .transform((val, ctx) => {
      const parsed = parseLocaleNumber(val);
      if (parsed === null) {
        ctx.addIssue({ code: 'custom', message });
        return z.NEVER;
      }
      return parsed;
    });

export const incomeSchema = localeAmount('Montant invalide.').refine((val) => val > 0, {
  message: 'Le revenu doit être supérieur à 0.',
});

export function habitsSchema(income: number) {
  return z
    .object({
      currentEssentialSpend: localeAmount('Montant invalide.').refine((val) => val >= 0, {
        message: 'Le montant doit être positif ou nul.',
      }),
      currentLeisureSpend: localeAmount('Montant invalide.').refine((val) => val >= 0, {
        message: 'Le montant doit être positif ou nul.',
      }),
    })
    .refine((data) => data.currentEssentialSpend + data.currentLeisureSpend <= income, {
      message: 'Le total de vos dépenses dépasse votre revenu mensuel.',
      path: ['currentLeisureSpend'],
    });
}

export const expenseAmountSchema = localeAmount('Montant invalide.').refine((val) => val > 0, {
  message: 'Le montant doit être supérieur à 0.',
});

export const expenseCategorySchema = z.number({ message: 'Sélectionnez une catégorie.' });

export const expenseDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.');
