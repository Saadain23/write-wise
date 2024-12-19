import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f3f4f6',
          hover: '#f9fafb',
        },
        text: {
          DEFAULT: '#111827',
          secondary: '#4b5563',
          muted: '#6b7280',
        },
        border: {
          DEFAULT: '#e5e7eb',
          secondary: '#d1d5db',
        },
        button: {
          DEFAULT: '#f3f4f6',
          hover: '#e5e7eb',
          active: '#d1d5db',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
