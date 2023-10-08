/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      width: {
        px: "960px",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["garden"],
  },
};
