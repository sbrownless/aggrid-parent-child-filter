export const excelColumnLabel = (index: number): string => {
  let label = '';
  let n = index + 1; // Excel columns are 1‑based

  while (n > 0) {
    const remainder = (n - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    n = Math.floor((n - 1) / 26);
  }

  return label;
}

export const generateColumnLabels = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => excelColumnLabel(i));
}
