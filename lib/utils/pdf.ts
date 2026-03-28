import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ProjectReportData {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    budget: number | null;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    assignee?: { name: string } | null;
  }>;
  rfis: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;
  dailyReports: Array<{
    id: string;
    date: Date;
    workPerformed: string;
    workforceCount: number;
  }>;
  budget?: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
  };
}

export function generateProjectReportPDF(data: ProjectReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Report', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.project.name, pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Status: ${data.project.status}`, 14, 40);
  doc.text(`Start Date: ${data.project.startDate ? new Date(data.project.startDate).toLocaleDateString() : 'N/A'}`, 14, 46);
  doc.text(`End Date: ${data.project.endDate ? new Date(data.project.endDate).toLocaleDateString() : 'N/A'}`, 14, 52);
  doc.text(`Budget: ${data.project.budget ? `$${data.project.budget.toLocaleString()}` : 'N/A'}`, 14, 58);

  if (data.project.description) {
    doc.text('Description:', 14, 68);
    doc.setFont('helvetica', 'bold');
    doc.text(data.project.description, 14, 74, { maxWidth: pageWidth - 28 });
    doc.setFont('helvetica', 'normal');
  }

  let yPos = 90;

  if (data.tasks.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tasks', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Title', 'Status', 'Priority', 'Due Date', 'Assignee']],
      body: data.tasks.map(task => [
        task.title,
        task.status,
        task.priority,
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        task.assignee?.name || 'Unassigned'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (data.rfis.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RFIs', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Number', 'Title', 'Status', 'Created']],
      body: data.rfis.map(rfi => [
        rfi.number,
        rfi.title,
        rfi.status,
        new Date(rfi.createdAt).toLocaleDateString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (data.dailyReports.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Reports', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Work Performed', 'Workforce Count']],
      body: data.dailyReports.map(report => [
        new Date(report.date).toLocaleDateString(),
        report.workPerformed.substring(0, 50) + (report.workPerformed.length > 50 ? '...' : ''),
        report.workforceCount.toString()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 }
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
}

interface SafetyReportData {
  project: {
    id: string;
    name: string;
  };
  incidents: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    createdAt: Date;
  }>;
  inspections: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
  }>;
  stats: {
    totalIncidents: number;
    openIncidents: number;
  };
}

export function generateSafetyReportPDF(data: SafetyReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text('SAFETY REPORT', pageWidth / 2, 20, { align: 'center' });
  doc.setTextColor(0);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.project.name, pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 36, { align: 'center' });

  doc.setFillColor(239, 68, 68);
  doc.rect(14, 44, pageWidth - 28, 24, 'F');
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.text(`Total Incidents: ${data.stats.totalIncidents}`, 20, 52);
  doc.text(`Open Incidents: ${data.stats.openIncidents}`, 80, 52);
  doc.setTextColor(0);

  let yPos = 80;

  if (data.incidents.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Safety Incidents', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Title', 'Severity', 'Status', 'Description']],
      body: data.incidents.map(incident => [
        new Date(incident.createdAt).toLocaleDateString(),
        incident.title,
        incident.severity,
        incident.status,
        incident.description.substring(0, 40) + (incident.description.length > 40 ? '...' : '')
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: 14, right: 14 }
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (data.inspections.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspections', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Title', 'Description', 'Status']],
      body: data.inspections.map(inspection => [
        inspection.title,
        (inspection.description || '').substring(0, 50) + (inspection.description && inspection.description.length > 50 ? '...' : ''),
        inspection.status
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      margin: { left: 14, right: 14 }
    });
  }

  return doc;
}

interface RFIReportData {
  project: {
    id: string;
    name: string;
  };
  rfis: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    createdAt: Date;
    answer?: string | null;
    assignedTo?: { name: string } | null;
  }>;
  stats: {
    total: number;
    open: number;
    answered: number;
    closed: number;
  };
}

export function generateRFIReportPDF(data: RFIReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 92, 246);
  doc.text('RFI REPORT', pageWidth / 2, 20, { align: 'center' });
  doc.setTextColor(0);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.project.name, pageWidth / 2, 28, { align: 'center' });

  doc.setFillColor(139, 92, 246);
  doc.rect(14, 38, pageWidth - 28, 20, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.text(`Total: ${data.stats.total}  |  Open: ${data.stats.open}  |  Answered: ${data.stats.answered}  |  Closed: ${data.stats.closed}`, pageWidth / 2, 50, { align: 'center' });
  doc.setTextColor(0);

  let yPos = 70;

  if (data.rfis.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Request for Information', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Number', 'Title', 'Status', 'Assigned To', 'Created', 'Answer']],
      body: data.rfis.map(rfi => [
        rfi.number,
        rfi.title.substring(0, 30) + (rfi.title.length > 30 ? '...' : ''),
        rfi.status,
        rfi.assignedTo?.name || 'Unassigned',
        new Date(rfi.createdAt).toLocaleDateString(),
        rfi.answer ? 'Yes' : 'Pending'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      margin: { left: 14, right: 14 }
    });
  }

  return doc;
}
