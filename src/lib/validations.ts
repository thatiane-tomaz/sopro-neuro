import { z } from "zod";

// Password validation - simple 6 characters with letters and numbers
export const passwordSchema = z
  .string()
  .min(6, "A senha deve ter no mínimo 6 caracteres")
  .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email("Email inválido")
  .max(255, "Email deve ter no máximo 255 caracteres");

// Display name validation
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Nome não pode estar vazio")
  .max(100, "Nome deve ter no máximo 100 caracteres")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos");

// Age validation
export const ageSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Idade deve ser um número")
  .refine((val) => {
    const age = parseInt(val);
    return age >= 18 && age <= 100;
  }, "Idade deve estar entre 18 e 100 anos");

// Gender validation - accepts the actual labels
export const genderSchema = z
  .string()
  .trim()
  .min(1, "Selecione uma opção válida");

// Smoking frequency validation - accepts the actual labels
export const smokingFrequencySchema = z
  .string()
  .trim()
  .min(1, "Selecione uma frequência válida");

// Smoking types validation
export const smokingTypesSchema = z
  .array(z.string().trim().max(100, "Tipo de tabagismo inválido"))
  .min(1, "Selecione pelo menos um tipo")
  .max(10, "Máximo de 10 tipos permitidos");

// Smoking reasons validation
export const smokingReasonsSchema = z
  .array(z.string().trim().max(100, "Motivo inválido"))
  .min(1, "Selecione pelo menos um motivo")
  .max(10, "Máximo de 10 motivos permitidos");

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

// Signup schema
export const signupSchema = z
  .object({
    name: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

// Password change schema
export const passwordChangeSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

// Email change schema
export const emailChangeSchema = z.object({
  newEmail: emailSchema,
});

// Display name update schema
export const displayNameUpdateSchema = z.object({
  displayName: displayNameSchema,
});

// Onboarding Question 1 schema
export const onboardingQuestion1Schema = z.object({
  age: ageSchema,
  gender: genderSchema,
});

// Onboarding Question 2 schema
export const onboardingQuestion2Schema = z.object({
  smokingFrequency: smokingFrequencySchema,
});

// Onboarding Question 3 schema
export const onboardingQuestion3Schema = z.object({
  smokingTypes: smokingTypesSchema,
});

// Onboarding Question 4 schema
export const onboardingQuestion4Schema = z.object({
  smokingReasons: smokingReasonsSchema,
});

// Full onboarding schema
export const onboardingSchema = z.object({
  age: ageSchema,
  gender: genderSchema,
  smokingFrequency: smokingFrequencySchema,
  smokingTypes: smokingTypesSchema,
  smokingReasons: smokingReasonsSchema,
});
