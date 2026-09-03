import type { TailwindConfig } from '@react-email/components';

/**
 * Complete Tailwind configuration for email templates
 *
 * This configuration includes:
 * - Brand colors with semantic naming
 * - Email-safe spacing and sizing
 * - Pixel-based typography
 * - Border radius values
 * - Shadow utilities (use sparingly, limited support)
 * - Screen breakpoints for responsive emails
 *
 * @example
 * ```typescript
 * // Use in your mail config:
 * import { tailwindEmailConfig } from './config/tailwind.config.example';
 *
 * export const mailConfig: IMailConfig = {
 *   // ... other config
 *   tailwindEmailConfig: tailwindEmailConfig,
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Use in email templates:
 * <div className="bg-brand-primary text-white p-6 rounded-lg">
 *   <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
 *   <p className="text-base text-brand-gray-100">
 *     Thank you for signing up.
 *   </p>
 * </div>
 * ```
 */
export const tailwindEmailConfig: TailwindConfig = {
  theme: {
    extend: {
      /**
       * Brand Color Palette
       *
       * Organized by semantic meaning for easy theming.
       * All colors tested for accessibility (WCAG AA compliance).
       */
      colors: {
        // Primary brand colors
        brand: {
          primary: '#4f46e5', // Indigo - Main brand color
          secondary: '#7c3aed', // Purple - Secondary brand color
          accent: '#06b6d4', // Cyan - Accent color
          dark: '#1e293b', // Slate - Dark backgrounds
          light: '#f8fafc', // Slate - Light backgrounds
        },

        // Neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },

        // Semantic colors
        success: {
          light: '#d1fae5', // Light green background
          DEFAULT: '#10b981', // Green - Success state
          dark: '#065f46', // Dark green text
        },
        error: {
          light: '#fee2e2', // Light red background
          DEFAULT: '#ef4444', // Red - Error state
          dark: '#991b1b', // Dark red text
        },
        warning: {
          light: '#fef3c7', // Light yellow background
          DEFAULT: '#f59e0b', // Amber - Warning state
          dark: '#92400e', // Dark amber text
        },
        info: {
          light: '#dbeafe', // Light blue background
          DEFAULT: '#3b82f6', // Blue - Info state
          dark: '#1e40af', // Dark blue text
        },

        // Social media brand colors (for social icons)
        social: {
          facebook: '#1877f2',
          twitter: '#1da1f2',
          linkedin: '#0a66c2',
          instagram: '#e4405f',
          youtube: '#ff0000',
          github: '#181717',
          discord: '#5865f2',
        },
      },

      /**
       * Spacing scale (pixel-based for email compatibility)
       *
       * Use for padding, margin, gap, etc.
       */
      spacing: {
        '0': '0px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },

      /**
       * Font family stacks
       *
       * Web-safe fonts with fallbacks for maximum compatibility.
       */
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },

      /**
       * Font sizes with line heights
       *
       * Pixel-based for email client compatibility.
       */
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '1' }],
        '6xl': ['60px', { lineHeight: '1' }],
        '7xl': ['72px', { lineHeight: '1' }],
        '8xl': ['96px', { lineHeight: '1' }],
        '9xl': ['128px', { lineHeight: '1' }],
      },

      /**
       * Font weights
       *
       * Standard weights that work across most email clients.
       */
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      /**
       * Line heights
       *
       * Relative line heights for better typography.
       */
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },

      /**
       * Letter spacing
       *
       * For adjusting character spacing.
       */
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      /**
       * Border radius
       *
       * Pixel values for consistent rounding across email clients.
       */
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px',
      },

      /**
       * Border widths
       */
      borderWidth: {
        DEFAULT: '1px',
        '0': '0px',
        '2': '2px',
        '4': '4px',
        '8': '8px',
      },

      /**
       * Box shadows
       *
       * Note: Shadow support varies by email client. Use sparingly.
       * Outlook doesn't support box-shadow well.
       */
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        none: 'none',
      },

      /**
       * Maximum widths
       *
       * Common email container widths.
       * 600px is the standard for email templates.
       */
      maxWidth: {
        xs: '320px',
        sm: '384px',
        md: '448px',
        lg: '512px',
        xl: '576px',
        '2xl': '600px', // Standard email width
        '3xl': '672px',
        '4xl': '768px',
        '5xl': '896px',
        '6xl': '1024px',
        '7xl': '1152px',
        full: '100%',
      },

      /**
       * Screen breakpoints for responsive emails
       *
       * Note: Media query support varies by email client.
       * Mobile-first approach recommended.
       */
      screens: {
        sm: '480px', // Mobile landscape
        md: '600px', // Tablets
        lg: '768px', // Desktop
        xl: '1024px', // Large desktop
      },

      /**
       * Z-index scale
       *
       * For layering elements (limited use in emails).
       */
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        auto: 'auto',
      },

      /**
       * Opacity scale
       */
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },
    },
  },
};

/**
 * Default export for convenience
 */
export default tailwindEmailConfig;
