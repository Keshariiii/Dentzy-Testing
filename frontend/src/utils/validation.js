export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_RULES = [
  { id: 'length',  label: 'At least 8 characters',               test: (p) => (p || '').length >= 8 },
  { id: 'upper',   label: 'At least 1 uppercase letter (A–Z)',    test: (p) => /[A-Z]/.test(p || '') },
  { id: 'lower',   label: 'At least 1 lowercase letter (a–z)',    test: (p) => /[a-z]/.test(p || '') },
  { id: 'number',  label: 'At least 1 number (0–9)',              test: (p) => /[0-9]/.test(p || '') },
  { id: 'special', label: 'At least 1 special character (!@#$%)',  test: (p) => /[^A-Za-z0-9]/.test(p || '') },
];

export const validatePassword = (pw) => {
  const password = pw || '';
  const rules = PASSWORD_RULES.map((r) => ({ ...r, passed: r.test(password) }));
  const passedCount = rules.filter((r) => r.passed).length;
  const isValid = passedCount === PASSWORD_RULES.length;
  return { rules, passedCount, isValid };
};
