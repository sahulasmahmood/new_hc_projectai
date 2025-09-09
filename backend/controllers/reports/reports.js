const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Helper: Pagination
function getPagination(query) {
  const page = parseInt(query.page) || 1;
  const pageSize = parseInt(query.pageSize) || 20;
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize };
}

// GET /api/reports/prescriptions
exports.getPrescriptionsReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { skip, take } = getPagination(req.query);
    const where = date ? { createdAt: { gte: new Date(date + 'T00:00:00Z'), lte: new Date(date + 'T23:59:59Z') } } : {};
    const [data, total] = await Promise.all([
      prisma.prescription.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.prescription.count({ where })
    ]);
    res.json({ data, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions report' });
  }
};

// GET /api/reports/appointments
exports.getAppointmentsReport = async (req, res) => {
  try {
    const { date } = req.query;
    const { skip, take } = getPagination(req.query);
    let where = {};
    if (date) {
      // Filter by date range (00:00 to 23:59 UTC)
      where = {
        date: {
          gte: date + 'T00:00:00.000Z',
          lte: date + 'T23:59:59.999Z'
        }
      };
    }
    const [data, total] = await Promise.all([
      prisma.appointment.findMany({ where, orderBy: { date: 'desc' }, skip, take }),
      prisma.appointment.count({ where })
    ]);
    res.json({ data, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments report' });
  }
};

// GET /api/reports/summary
exports.getSummaryMetrics = async (req, res) => {
  try {
    const { date } = req.query;
    let dateRange = {};
    if (date) {
      dateRange = {
        date: {
          gte: date + 'T00:00:00.000Z',
          lte: date + 'T23:59:59.999Z'
        }
      };
    }
    // Case-insensitive status check for completed and not_visited
    const [totalAppointments, completedAppointments, noShowAppointments, totalPrescriptions] = await Promise.all([
      prisma.appointment.count({ where: dateRange }),
      prisma.appointment.count({ where: { ...dateRange, status: { equals: 'completed', mode: 'insensitive' } } }),
      prisma.appointment.count({ where: { ...dateRange, status: { equals: 'not_visited', mode: 'insensitive' } } }),
      prisma.prescription.count({ where: date ? { createdAt: { gte: new Date(date + 'T00:00:00Z'), lte: new Date(date + 'T23:59:59Z') } } : {} })
    ]);
    res.json({ totalAppointments, completedAppointments, noShowAppointments, totalPrescriptions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary metrics' });
  }
};

// GET /api/reports/prescriptions/export
exports.exportPrescriptionsReport = async (req, res) => {
  try {
    const { date, format } = req.query;
    const where = date ? { createdAt: { gte: new Date(date + 'T00:00:00Z'), lte: new Date(date + 'T23:59:59Z') } } : {};
    const data = await prisma.prescription.findMany({ where, orderBy: { createdAt: 'desc' } });
    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('prescriptions_report.csv');
      return res.send(csv);
    } else {
      // PDF export (simple table)
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=prescriptions_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Prescriptions Report', { align: 'center' });
      doc.moveDown();
      data.forEach((item, i) => {
        doc.fontSize(10).text(`${i + 1}. Patient: ${item.patientName}, Date: ${item.createdAt}, Doctor: ${item.doctorName || ''}`);
      });
      doc.end();
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to export prescriptions report' });
  }
};

// GET /api/reports/appointments/export
exports.exportAppointmentsReport = async (req, res) => {
  try {
    const { date, format } = req.query;
    let where = {};
    if (date) {
      where = {
        date: {
          gte: date + 'T00:00:00.000Z',
          lte: date + 'T23:59:59.999Z'
        }
      };
    }
    const data = await prisma.appointment.findMany({ where, orderBy: { date: 'desc' } });
    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('appointments_report.csv');
      return res.send(csv);
    } else {
      // PDF export (simple table)
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=appointments_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Appointments Report', { align: 'center' });
      doc.moveDown();
      data.forEach((item, i) => {
        doc.fontSize(10).text(`${i + 1}. Patient ID: ${item.patientId}, Date: ${item.date}, Status: ${item.status}`);
      });
      doc.end();
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to export appointments report' });
  }
};
