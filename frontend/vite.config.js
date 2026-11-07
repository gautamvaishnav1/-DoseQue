import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Vite configuration.
// - react()      -> JSX transform
// - tailwindcss() -> Tailwind CSS v4 integration (v4 is a Vite plugin,
//   it does NOT need tailwind.config.js or postcss.config.js like v3 did)
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
