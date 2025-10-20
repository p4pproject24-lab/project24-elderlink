import { colors } from '../colors';
import { useFontSizes } from '../fontSizes';
import { useIconSizes } from '../iconSizes';
import { useTypography } from '../typography';

jest.mock('react-native', () => ({
  Platform: { OS: 'default', select: (m: any) => m.default },
  useWindowDimensions: () => ({ width: 500, height: 800 }),
}));

describe('theme exports', () => {
  it('colors provides both light and dark palettes', () => {
    expect(colors.light.primary).toBeTruthy();
    expect(colors.dark.primary).toBeTruthy();
  });

  it('useFontSizes covers small/medium/large branches', () => {
    expect(useFontSizes('small').body).toBeLessThan(useFontSizes('medium').body);
    expect(useFontSizes('large').body).toBeGreaterThan(useFontSizes('medium').body);
  });

  it('useIconSizes covers small/medium/large branches', () => {
    expect(useIconSizes('small').md).toBeLessThan(useIconSizes('medium').md);
    expect(useIconSizes('large').md).toBeGreaterThan(useIconSizes('medium').md);
  });

  it('useTypography returns styles for requested theme/scale', () => {
    const tLight = useTypography('light', 'small');
    const tDark = useTypography('dark', 'large');
    expect(tLight.body.color).toBe(colors.light.textPrimary);
    expect(tDark.body.color).toBe(colors.dark.textPrimary);
  });

  it('covers Platform.select branches for ios/android/default', () => {
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios', select: (m: any) => m.ios }, useWindowDimensions: () => ({ width: 500, height: 800 }) }));
    const { useTypography: useTypographyIOS } = require('../typography');
    const ios = useTypographyIOS('light', 'medium');
    expect(ios.body.fontFamily).toBe('System');

    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'android', select: (m: any) => m.android }, useWindowDimensions: () => ({ width: 500, height: 800 }) }));
    const { useTypography: useTypographyAndroid } = require('../typography');
    const andr = useTypographyAndroid('light', 'medium');
    expect(andr.body.fontFamily).toBe('Roboto');

    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'windows', select: (m: any) => m.default }, useWindowDimensions: () => ({ width: 500, height: 800 }) }));
    const { useTypography: useTypographyDefault } = require('../typography');
    const def = useTypographyDefault('light', 'medium');
    expect(def.body.fontFamily).toBe('System');
  });

  it('covers width thresholds for fontSizes and iconSizes', () => {
    const makeWithWidth = (w: number) => {
      jest.resetModules();
      jest.doMock('react-native', () => ({ Platform: { OS: 'ios', select: (m: any) => m.ios }, useWindowDimensions: () => ({ width: w, height: 800 }) }));
      return {
        useFontSizes: require('../fontSizes').useFontSizes,
        useIconSizes: require('../iconSizes').useIconSizes,
      };
    };
    const a = makeWithWidth(320);
    const b = makeWithWidth(400);
    const c = makeWithWidth(700);
    const fa = a.useFontSizes('medium');
    const fb = b.useFontSizes('medium');
    const fc = c.useFontSizes('medium');
    expect(fa.body).toBeLessThan(fb.body);
    expect(fb.body).toBeLessThan(fc.body);
    const ia = a.useIconSizes('medium');
    const ib = b.useIconSizes('medium');
    const ic = c.useIconSizes('medium');
    expect(ia.md).toBeLessThan(ib.md);
    expect(ib.md).toBeLessThan(ic.md);
  });
});


