/// <reference types="vite/client" />

declare module '*.css';

// --- ADD THIS SECTION ---
// This tells TypeScript: "When I import any file with '?raw' at the end, 
// treat it as a plain string."
declare module '*?raw' {
  const content: string;
  export default content;
}

// Optional: Specific override for .pegjs files if the above generic one doesn't catch it
declare module '*.pegjs?raw' {
  const content: string;
  export default content;
}