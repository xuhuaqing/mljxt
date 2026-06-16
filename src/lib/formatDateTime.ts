export function formatDateTime(value: string | null | undefined): string {
  if (!value || value === '-') return '-';

  const trimmed = value.trim();

  const isoMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/
  );
  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2]}`;
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace(/\.\d+$/, '');
  }

  if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\//g, '-');
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return trimmed.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function formatFreeUsage(value?: boolean): string {
  if (value === true) return '是';
  if (value === false) return '否';
  return '—';
}
