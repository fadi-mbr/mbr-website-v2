// Simple math CAPTCHA for anti-abuse

export interface CaptchaChallenge {
  question: string;
  answer: number;
}

export function generateCaptcha(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  
  return {
    question: `${num1} + ${num2} = ?`,
    answer,
  };
}

export function validateCaptcha(userAnswer: number, correctAnswer: number): boolean {
  return userAnswer === correctAnswer;
}

