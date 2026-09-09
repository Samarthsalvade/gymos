import { Request } from 'express';

export function qs(req: Request, key: string): string | undefined {
  const val = req.query[key];
  if (!val) return undefined;
  return Array.isArray(val) ? (val[0] as string) : (val as string);
}
