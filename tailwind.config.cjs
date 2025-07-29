/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [
    require("@tailwindcss/typography"),
  ],
  theme: {
    fontFamily: {
      serif: ["Fraunces", "Georgia", "serif"],
      sans: ["Fraunces", "system-ui", "sans-serif"],
      display: ["Oranienbaum", "Georgia", "serif"],
      body: ["Fraunces", "Georgia", "serif"],
    },
    extend: {
      colors: {
        beige: {
          50: '#faf7f2',
          100: '#f5f1eb',
          200: '#ebe3d4',
          300: '#ddd0bd',
          400: '#c9b896',
          500: '#b8a082',
          600: '#a08a70',
          700: '#86725c',
          800: '#6d5f4e',
          900: '#594f42',
        },
      },
      typography: {
        beige: {
          css: {
            '--tw-prose-body': '#594f42',
            '--tw-prose-headings': '#594f42',
            '--tw-prose-lead': '#6d5f4e',
            '--tw-prose-links': '#86725c',
            '--tw-prose-bold': '#594f42',
            '--tw-prose-counters': '#a08a70',
            '--tw-prose-bullets': '#c9b896',
            '--tw-prose-hr': '#ebe3d4',
            '--tw-prose-quotes': '#594f42',
            '--tw-prose-quote-borders': '#ebe3d4',
            '--tw-prose-captions': '#a08a70',
            '--tw-prose-code': '#594f42',
            '--tw-prose-pre-code': '#f5f1eb',
            '--tw-prose-pre-bg': '#594f42',
            '--tw-prose-th-borders': '#ddd0bd',
            '--tw-prose-td-borders': '#ebe3d4',
          },
        },
      },
      width: {
        px: "960px",
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      letterSpacing: {
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
    },
  },
};
