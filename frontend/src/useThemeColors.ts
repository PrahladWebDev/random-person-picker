import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './theme';

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
