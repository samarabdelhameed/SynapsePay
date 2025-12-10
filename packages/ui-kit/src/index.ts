/**
 * SynapsePay UI Kit
 * Reusable React components for the SynapsePay ecosystem
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Button variants using class-variance-authority
 */
export { cva, type VariantProps } from 'class-variance-authority';

/**
 * Re-export utilities
 */
export { clsx, twMerge };
