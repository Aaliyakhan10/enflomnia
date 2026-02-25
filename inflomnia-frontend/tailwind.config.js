/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
            colors: {
                brand: {
                    50: "#f0f4ff",
                    100: "#e0e9ff",
                    500: "#6366f1",
                    600: "#4f46e5",
                    700: "#4338ca",
                },
                shield: { green: "#22c55e", yellow: "#f59e0b", red: "#ef4444" },
            },
        },
    },
    plugins: [],
};
