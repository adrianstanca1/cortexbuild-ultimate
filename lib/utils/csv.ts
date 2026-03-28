interface ExportOptions {
  filename: string;
  includeHeaders?: boolean;
}

type CsvValue = string | number | boolean | null | undefined;

export function arrayToCsv<T extends object>(
  data: T[],
  options: ExportOptions
): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvLines: string[] = [];

  if (options.includeHeaders !== false) {
    csvLines.push(headers.map(escapeCsvValue).join(','));
  }

  for (const row of data) {
    const values = headers.map(header => escapeCsvValue((row as Record<string, CsvValue>)[header]));
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

export function exportToCsv<T extends object>(
  data: T[],
  options: ExportOptions
): void {
  const csv = arrayToCsv(data, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${options.filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

interface ProjectExport {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
}

export function exportProjectsToCsv(projects: ProjectExport[]): string {
  return arrayToCsv(projects, { filename: 'projects', includeHeaders: true });
}

interface TaskExport {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectName: string;
  assigneeName: string | null;
}

export function exportTasksToCsv(tasks: TaskExport[]): string {
  return arrayToCsv(tasks, { filename: 'tasks', includeHeaders: true });
}

interface RfiExport {
  id: string;
  number: string;
  title: string;
  status: string;
  question: string;
  answer: string | null;
  projectName: string;
  assignedToName: string | null;
  createdAt: string;
}

export function exportRfisToCsv(rfis: RfiExport[]): string {
  return arrayToCsv(rfis, { filename: 'rfis', includeHeaders: true });
}

interface SafetyExport {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  projectName: string;
  reportedByName: string | null;
  createdAt: string;
}

export function exportSafetyIncidentsToCsv(incidents: SafetyExport[]): string {
  return arrayToCsv(incidents, { filename: 'safety_incidents', includeHeaders: true });
}

interface BudgetExport {
  id: string;
  category: string;
  description: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  projectName: string;
}

export function exportBudgetsToCsv(budgets: BudgetExport[]): string {
  return arrayToCsv(budgets, { filename: 'budgets', includeHeaders: true });
}

interface DailyReportExport {
  id: string;
  date: string;
  projectName: string;
  workPerformed: string;
  workforceCount: number;
  weather: string;
  notes: string | null;
}

export function exportDailyReportsToCsv(reports: DailyReportExport[]): string {
  return arrayToCsv(reports, { filename: 'daily_reports', includeHeaders: true });
}
