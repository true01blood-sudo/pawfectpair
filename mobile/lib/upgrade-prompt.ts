/**
 * Prompt de upgrade pentru module Premium — plata se face DOAR pe web
 * (decizie produs), aplicația mobilă doar informează și trimite acolo.
 */
import { Alert, Linking } from 'react-native';

const PLANS_URL = 'https://pawfectpair.app/planuri';

export function promptUpgrade(moduleName?: string) {
  Alert.alert(
    'Modul Premium',
    moduleName
      ? `"${moduleName}" face parte din planul Premium (19,99€/an). Abonează-te pe site ca să-l deblochezi.`
      : 'Acest modul face parte din planul Premium (19,99€/an). Abonează-te pe site ca să-l deblochezi.',
    [
      { text: 'Mai târziu', style: 'cancel' },
      { text: 'Vezi planurile', onPress: () => Linking.openURL(PLANS_URL).catch(() => {}) },
    ]
  );
}
