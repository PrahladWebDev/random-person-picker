export const palette = {
  primary: '#6C5CE7',
  primaryDark: '#5849C2',
  accent: '#FDCB6E',
  danger: '#E17055',
  success: '#00B894',
};

export const lightTheme = {
  background: '#F7F7FB',
  card: '#FFFFFF',
  text: '#1E1E2E',
  subtext: '#6B6B7B',
  border: '#E6E6F0',
  placeholder: '#D8D8E8',
  ...palette,
};

export const darkTheme = {
  background: '#14141F',
  card: '#1E1E2E',
  text: '#F2F2F7',
  subtext: '#9B9BAE',
  border: '#2C2C3E',
  placeholder: '#2C2C3E',
  ...palette,
};

export type Theme = typeof lightTheme;
