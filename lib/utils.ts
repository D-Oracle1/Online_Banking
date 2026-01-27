export function generateAccountNumber(): string {
  const part1 = Math.floor(Math.random() * 90 + 10);
  const part2 = Math.floor(Math.random() * 90 + 10);
  const part3 = Math.floor(Math.random() * 90 + 10);
  const part4 = Math.floor(Math.random() * 9000000000 + 1000000000);
  return `${part1}-${part2}-${part3} ${part4}`;
}

export function generateCardNumber(): string {
  const part1 = Math.floor(Math.random() * 9000 + 1000);
  const part2 = Math.floor(Math.random() * 9000 + 1000);
  const part3 = Math.floor(Math.random() * 9000 + 1000);
  const part4 = Math.floor(Math.random() * 9000 + 1000);
  return `${part1} ${part2} ${part3} ${part4}`;
}

export function generateCVV(): string {
  return String(Math.floor(Math.random() * 900 + 100));
}

export function generateExpiryDate(): string {
  const now = new Date();
  const futureYear = now.getFullYear() + 4;
  const month = String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0');
  return `${month}/${String(futureYear).slice(-2)}`;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
