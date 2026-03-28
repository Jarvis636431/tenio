import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          selected: "hsl(var(--sidebar-selected))",
          "selected-foreground": "hsl(var(--sidebar-selected-foreground))",
        },
        "category-blue": {
          DEFAULT: "hsl(var(--category-blue))",
          50: "hsl(var(--category-blue-50))",
          100: "hsl(var(--category-blue-100))",
          200: "hsl(var(--category-blue-200))",
          600: "hsl(var(--category-blue-600))",
          700: "hsl(var(--category-blue-700))",
          800: "hsl(var(--category-blue-800))",
        },
        "category-purple": {
          DEFAULT: "hsl(var(--category-purple))",
          50: "hsl(var(--category-purple-50))",
          100: "hsl(var(--category-purple-100))",
          200: "hsl(var(--category-purple-200))",
          600: "hsl(var(--category-purple-600))",
          700: "hsl(var(--category-purple-700))",
          800: "hsl(var(--category-purple-800))",
        },
        "category-green": {
          DEFAULT: "hsl(var(--category-green))",
          50: "hsl(var(--category-green-50))",
          100: "hsl(var(--category-green-100))",
          200: "hsl(var(--category-green-200))",
          600: "hsl(var(--category-green-600))",
          700: "hsl(var(--category-green-700))",
          800: "hsl(var(--category-green-800))",
        },
        "category-yellow": {
          DEFAULT: "hsl(var(--category-yellow))",
          50: "hsl(var(--category-yellow-50))",
          100: "hsl(var(--category-yellow-100))",
          200: "hsl(var(--category-yellow-200))",
          600: "hsl(var(--category-yellow-600))",
          700: "hsl(var(--category-yellow-700))",
          800: "hsl(var(--category-yellow-800))",
        },
        "category-orange": {
          DEFAULT: "hsl(var(--category-orange))",
          50: "hsl(var(--category-orange-50))",
          100: "hsl(var(--category-orange-100))",
          200: "hsl(var(--category-orange-200))",
          600: "hsl(var(--category-orange-600))",
          700: "hsl(var(--category-orange-700))",
          800: "hsl(var(--category-orange-800))",
        },
        "category-red": {
          DEFAULT: "hsl(var(--category-red))",
          50: "hsl(var(--category-red-50))",
          100: "hsl(var(--category-red-100))",
          200: "hsl(var(--category-red-200))",
          600: "hsl(var(--category-red-600))",
          700: "hsl(var(--category-red-700))",
          800: "hsl(var(--category-red-800))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(8px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in": {
          "0%": {
            opacity: "0",
            transform: "translateX(-8px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
