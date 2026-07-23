/// <reference types="vite/client" />

declare module "*.ttf?url" {
  const src: string;
  export default src;
}

declare module "*.png?url" {
  const src: string;
  export default src;
}
