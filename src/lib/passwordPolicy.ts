export interface IPasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateStrongPassword = (password: string): IPasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 10) errors.push('Mínimo de 10 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Pelo menos uma letra maiúscula');
  if (!/[a-z]/.test(password)) errors.push('Pelo menos uma letra minúscula');
  if (!/\d/.test(password)) errors.push('Pelo menos um número');
  if (!/[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(password)) {
    errors.push('Pelo menos um caractere especial (!@#$%...)');
  }

  return { isValid: errors.length === 0, errors };
};
