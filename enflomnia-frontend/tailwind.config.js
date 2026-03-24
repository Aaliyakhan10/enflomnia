/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
            },
            colors: {
                brand: { DEFAULT: "#7c3aed", light: "#8b5cf6", pale: "#ede9fe" },
                surface: { DEFAULT: "#ffffff", 2: "#f8f7ff", 3: "#f1f0f9", 4: "#e9e7f7" },
            },
            boxShadow: {
                card: "0 1px 4px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(124,58,237,0.05)",
                brand: "0 2px 12px rgba(124,58,237,0.3)",
            },
            borderRadius: {
                "2xl": "16px",
                "3xl": "20px",
            },
        },
    },
    plugins: [],
};
