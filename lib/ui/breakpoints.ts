export enum Breakpoint {
  Desktop = 960
}

export const isMobileViewport = (viewportWidth: number): boolean => {
  return viewportWidth < Breakpoint.Desktop;
};
