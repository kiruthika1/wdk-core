const EXCEPTIONS: Set<number> = new Set([20008]);

export function toULNv2(eid: number): number {
  if (EXCEPTIONS.has(eid)) return eid;
  if (eid < 100) return eid + 100;
  if (eid < 10000) return eid;
  if (eid < 10100) return eid + 100;
  if (eid < 20000) return eid;
  if (eid < 20100) return eid + 100;
  return eid;
}
