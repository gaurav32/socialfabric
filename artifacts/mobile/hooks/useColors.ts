import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Always returns the light palette — the app defaults to light mode
 * regardless of the device's appearance setting, ignoring the `dark` key
 * in constants/colors.ts.
 */
export function useColors() {
  return { ...colors.light, radius: colors.radius };
}
