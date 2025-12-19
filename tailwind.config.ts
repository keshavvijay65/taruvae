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
                primary: {
                    DEFAULT: "#8B7355",
                    dark: "#6B5A42",
                    light: "#A68B6B",
                },
                cream: {
                    DEFAULT: "#F5F1EB",
                    light: "#FAF8F5",
                },
            },
            backgroundColor: {
                'cream': '#F5F1EB',
                'cream-light': '#FAF8F5',
            },
        },
    },
    plugins: [],
};
export default config;

