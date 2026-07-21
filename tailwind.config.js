/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#23211E",
        "ink-soft": "#6B6258",
        hanji: "#FAF6EE",
        surface: "#FFFFFF",
        line: "#E7DECF",
        accent: "#9E3B2F",     // 석간주
        "accent-2": "#2E7D74", // 뇌록
        gold: "#C8A24B",       // 금/황
      },
      fontFamily: {
        body: ['Pretendard', 'system-ui', 'sans-serif'],
        title: ['"Noto Serif KR"', 'serif'],
      },
      borderRadius: { xl2: "16px" },
    },
  },
  plugins: [],
};
