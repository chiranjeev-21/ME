import type { DesktopAppProps, DesktopSettings } from './types';
import styles from './Desktop.module.css';

export function SettingsApp({ settings, setSettings }: DesktopAppProps) {
  const options: {
    key: keyof DesktopSettings;
    label: string;
    values: { value: string; label: string }[];
  }[] = [
    {
      key: 'wallpaper',
      label: 'Wallpaper',
      values: [
        { value: 'aurora', label: 'After hours' },
        { value: 'midnight', label: 'Midnight' },
        { value: 'blueprint', label: 'Blueprint' },
      ],
    },
    {
      key: 'accent',
      label: 'Accent color',
      values: [
        { value: 'green', label: 'Terminal green' },
        { value: 'amber', label: 'Warm amber' },
        { value: 'violet', label: 'Electric violet' },
        { value: 'cyan', label: 'Ice cyan' },
      ],
    },
    {
      key: 'fontSize',
      label: 'Font size',
      values: [
        { value: 'small', label: 'Compact' },
        { value: 'normal', label: 'Default' },
        { value: 'large', label: 'Comfortable' },
      ],
    },
  ];
  return (
    <div className={styles.settingsApp}>
      <span className={styles.appEyebrow}>MAKE YOURSELF AT HOME</span>
      <h2>A little more you.</h2>
      <p>These preferences stay in this browser. No account, no tracking.</p>
      {options.map(option => (
        <fieldset key={option.key}>
          <legend>{option.label}</legend>
          <div className={styles.settingChoices}>
            {option.values.map(item => (
              <label key={item.value}>
                <input
                  type="radio"
                  name={option.key}
                  value={item.value}
                  checked={settings[option.key] === item.value}
                  onChange={() =>
                    setSettings({ [option.key]: item.value } as Partial<DesktopSettings>)
                  }
                />
                {option.key === 'accent' && <i data-color={item.value} />}
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className={styles.settingsNote}>
        Reduced motion follows your device preference. On phones, every app opens as a full-screen
        view.
      </div>
    </div>
  );
}
