import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary)',
          light: 'var(--color-primary)',
        },
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-btn-success)',
        pending: 'var(--color-btn-warning)',
        failed: 'var(--color-btn-danger)',
        // Custom color mappings for better theme support
        'bg-light': 'var(--color-bg-light)',
        'bg-dark': 'var(--color-bg-dark)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'btn-primary': 'var(--color-btn-primary)',
        'btn-secondary': 'var(--color-btn-secondary)',
        'btn-success': 'var(--color-btn-success)',
        'btn-warning': 'var(--color-btn-warning)',
        'btn-danger': 'var(--color-btn-danger)',
        'custom-border': 'var(--color-border)',
      },
      fontFamily: {
        sans: ['Jost', 'sans-serif'],
        heading: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
