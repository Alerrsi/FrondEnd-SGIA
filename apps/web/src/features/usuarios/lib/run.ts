export function validateRun(run: string): boolean {
  const clean = run.replace(/[.\s-]/g, '').toLowerCase();
  const match = /^(\d{1,8})([0-9k])$/.exec(clean);
  if (!match) return false;

  const body = match[1]!;
  const dv = match[2]!;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += (body.charCodeAt(i) - 48) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expected = 11 - (sum % 11);
  const expectedDv =
    expected === 11 ? '0' : expected === 10 ? 'k' : String(expected);
  return expectedDv === dv;
}

export function normalizeStoredRun(run: string): string {
  return run.replace(/[.\s]/g, '').toUpperCase();
}

export function formatRun(run: string): string {
  const clean = run.replace(/[.\s]/g, '').toUpperCase();
  const match = /^(\d{1,8})-([0-9K])$/.exec(clean);
  if (!match) return clean;

  const body = match[1]!;
  const dv = match[2]!;
  const dotted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${dotted}-${dv}`;
}