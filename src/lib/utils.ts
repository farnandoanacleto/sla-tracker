import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Função utilitária cn para mesclar classes Tailwind CSS condicionalmente de forma segura.
 * Resolve conflitos de classes do Tailwind (ex: p-2 vs p-4).
 * 
 * @param inputs Lista de classes condicionais ou literais
 * @returns String de classes mescladas
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

