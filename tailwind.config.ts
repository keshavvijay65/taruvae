import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: "#2F5D3A",
                    forest: "#1F3D2B",
                    main: "#2F5D3A",
                    light: "#EAF3EE",
                    50: "#F0F7F2",
                    100: "#EAF3EE",
                    200: "#C1DFCB",
                    300: "#A2CFB1",
                    400: "#83BF97",
                    500: "#2F5D3A", // Secondary Green
                    600: "#1F3D2B", // Primary Green
                    700: "#182F21",
                    800: "#122117",
                    900: "#0B140E",
                    dark: "#1F3D2B",
                    brown: "#5D4037",
                    beige: "#F5F5DC",
                },
                gold: {
                    DEFAULT: "#C9A24D",
                    light: "#D4B87A",
                    dark: "#A67C2E",
                },
                cream: {
                    DEFAULT: "#FAF8F3",
                    dark: "#F1EDE6",
                },
                beige: {
                    DEFAULT: "#F1EDE6",
                    soft: "#FAF8F3",
                },
                text: {
                    primary: "#1F2937",
                    secondary: "#6B7280",
                    dark: "#1F2937",
                },
                border: {
                    DEFAULT: "#E5E7EB",
                    soft: "#E5E7EB",
                },
                success: {
                    DEFAULT: "#2E7D32",
                },
                error: {
                    DEFAULT: "#B91C1C",
                },
            },
            // Premium Typography
            fontFamily: {
                sans: ['var(--font-jakarta)', 'Inter', 'sans-serif'],
                serif: ['var(--font-fraunces)', 'Playfair Display', 'serif'],
                display: ['var(--font-fraunces)', 'Playfair Display', 'serif'],
            },
            // Refined Spacing Scale
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            // Premium Border Radius
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'premium-sm': '0 2px 8px -2px rgba(47, 93, 58, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.05)',
                'premium': '0 4px 20px -4px rgba(47, 93, 58, 0.12), 0 8px 32px -8px rgba(0, 0, 0, 0.08)',
                'premium-lg': '0 8px 32px -8px rgba(47, 93, 58, 0.15), 0 16px 48px -12px rgba(0, 0, 0, 0.1)',
                'premium-xl': '0 16px 48px -12px rgba(47, 93, 58, 0.18), 0 24px 64px -16px rgba(0, 0, 0, 0.12)',
                'gold-glow': '0 0 20px rgba(184, 149, 74, 0.3), 0 0 40px rgba(184, 149, 74, 0.15)',
                'card-hover': '0 20px 40px -12px rgba(47, 93, 58, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            },
            // Premium Transitions
            transitionTimingFunction: {
                'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
                'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            // Animations
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-in-right': {
                    '0%': { opacity: '0', transform: 'translateX(-16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'pulse-soft': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
                'fade-in': 'fade-in 0.4s ease-out forwards',
                'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
                'scale-in': 'scale-in 0.3s ease-out forwards',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
                'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
            },
            // Typography Scale
            fontSize: {
                'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'display': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
                'heading-xl': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
                'heading-lg': ['1.875rem', { lineHeight: '1.3' }],
                'heading': ['1.5rem', { lineHeight: '1.35' }],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-premium': 'linear-gradient(135deg, #FAF8F3 0%, #FFFFFF 50%, #F1EDE6 100%)',
                'gradient-gold': 'linear-gradient(135deg, #C9A24D 0%, #D4B87A 50%, #C9A24D 100%)',
                'gradient-forest': 'linear-gradient(135deg, #1F3D2B 0%, #2F5D3A 100%)',
                'gradient-green': 'linear-gradient(135deg, #EAF3EE 0%, #FFFFFF 50%, #FAF8F3 100%)',
                'gradient-green-subtle': 'linear-gradient(180deg, #EAF3EE 0%, #FFFFFF 100%)',
                'gradient-page': 'linear-gradient(180deg, #FAF8F3 0%, #F1EDE6 100%)',
            },
        },
    },
    plugins: [],
};
export default config;
