export const ValidationService = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * Requirements:
   * - At least 8 characters
   * - At least one letter
   * - At least one number
   */
  isValidPassword(password: string): boolean {
    if (password.length < 8) {
      return false;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber;
  },

  /**
   * Get password validation error message
   */
  getPasswordError(password: string): string | null {
    if (!password) {
      return "Senha é obrigatória";
    }
    if (password.length < 8) {
      return "Senha deve ter pelo menos 8 caracteres";
    }
    if (!/[a-zA-Z]/.test(password)) {
      return "Senha deve conter letras";
    }
    if (!/\d/.test(password)) {
      return "Senha deve conter números";
    }
    return null;
  },

  /**
   * Validate username format
   */
  isValidUsername(username: string): boolean {
    if (username.length < 3) {
      return false;
    }
    return /^[a-zA-Z0-9_-]+$/.test(username);
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Check if user is 18+ years old
   */
  isAdult(birthDate: string): boolean {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 18;
  },

  /**
   * Validate required field
   */
  isNotEmpty(value: unknown): boolean {
    return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
  },

  /**
   * Get all validation errors for signup form
   */
  validateSignup(data: {
    name: string;
    lastname: string;
    username: string;
    email: string;
    birthday: string;
    password: string;
    confirmPassword: string;
  }): string[] {
    const errors: string[] = [];

    if (!this.isNotEmpty(data.name)) {
      errors.push("Nome é obrigatório");
    }

    if (!this.isNotEmpty(data.lastname)) {
      errors.push("Sobrenome é obrigatório");
    }

    if (!this.isNotEmpty(data.username)) {
      errors.push("Nome de usuário é obrigatório");
    } else if (!this.isValidUsername(data.username)) {
      errors.push(
        "Nome de usuário deve ter 3+ caracteres e conter apenas letras, números, _ e -"
      );
    }

    if (!this.isNotEmpty(data.email)) {
      errors.push("Email é obrigatório");
    } else if (!this.isValidEmail(data.email)) {
      errors.push("Email inválido");
    }

    if (!this.isNotEmpty(data.birthday)) {
      errors.push("Data de nascimento é obrigatória");
    } else if (!this.isValidDate(data.birthday)) {
      errors.push("Data de nascimento inválida (use YYYY-MM-DD)");
    } else if (!this.isAdult(data.birthday)) {
      errors.push("Você deve ter 18+ anos");
    }

    const passwordError = this.getPasswordError(data.password);
    if (passwordError) {
      errors.push(passwordError);
    }

    if (data.password !== data.confirmPassword) {
      errors.push("As senhas não coincidem");
    }

    return errors;
  },
};
