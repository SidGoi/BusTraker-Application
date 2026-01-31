/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/(user)/**/*.{js,jsx,ts,tsx}",
    "./app/(admin)/**/*.{js,jsx,ts,tsx}",
    "./app/(super)/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        regular: ["GoogleSans-Regular"],
        medium: ["GoogleSans-Medium"],
        bold: ["GoogleSans-Bold"],
        semibold: ["GoogleSans-SemiBold"],
      },
    },
  },
  plugins: [],
};
