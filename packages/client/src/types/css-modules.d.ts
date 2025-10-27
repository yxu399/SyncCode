/**
 * CSS Modules Type Declarations
 * Allows TypeScript to recognize .module.css imports
 */

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
