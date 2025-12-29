import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        },
        // Game-specific colors
        celu: {
          DEFAULT: "hsl(var(--celu))",
          glow: "hsl(var(--celu-glow))",
          dim: "hsl(var(--celu-dim))",
        },
        ak: {
          DEFAULT: "hsl(var(--ak))",
          glow: "hsl(var(--ak-glow))",
          dim: "hsl(var(--ak-dim))",
        },
        link: {
          severed: "hsl(var(--link-severed))",
          nascent: "hsl(var(--link-nascent))",
          stable: "hsl(var(--link-stable))",
          deep: "hsl(var(--link-deep))",
          ascension: "hsl(var(--link-ascension))",
        },
        fragment: {
          dormant: "hsl(var(--fragment-dormant))",
          active: "hsl(var(--fragment-active))",
          collected: "hsl(var(--fragment-collected))",
        },
        nebula: {
          purple: "hsl(var(--nebula-purple))",
          blue: "hsl(var(--nebula-blue))",
          teal: "hsl(var(--nebula-teal))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.05)", filter: "brightness(1.2)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "orbit": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "collapse-shake": {
          "0%, 100%": { transform: "translate(-50%, -50%) rotate(0deg)" },
          "25%": { transform: "translate(-48%, -52%) rotate(-1deg)" },
          "50%": { transform: "translate(-52%, -48%) rotate(1deg)" },
          "75%": { transform: "translate(-50%, -50%) rotate(-0.5deg)" },
        },
        "divine-aura": {
          "0%, 100%": { boxShadow: "0 0 30px hsl(50 100% 70% / 0.3), 0 0 60px hsl(50 100% 70% / 0.2)" },
          "50%": { boxShadow: "0 0 50px hsl(50 100% 70% / 0.5), 0 0 100px hsl(50 100% 70% / 0.3)" },
        },
        "star-twinkle": {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "breathe": "breathe 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
        "orbit": "orbit 20s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "collapse-shake": "collapse-shake 0.3s ease-in-out infinite",
        "divine-aura": "divine-aura 2s ease-in-out infinite",
        "star-twinkle": "star-twinkle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
