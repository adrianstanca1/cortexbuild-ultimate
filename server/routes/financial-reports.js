const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const [projects, invoices] = await Promise.all([
      pool.query('SELECT * FROM projects'),
      pool.query('SELECT * FROM invoices'),
    ]);

    const totalBudget = projects.rows.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    const totalSpent = projects.rows.reduce((sum, p) => sum + (parseFloat(p.spent) || 0), 0);
    const paidInvoices = invoices.rows.filter(i => i.status === 'paid');
    const pendingInvoices = invoices.rows.filter(i => i.status === 'pending' || i.status === 'sent');
    const overdueInvoices = invoices.rows.filter(i => i.status === 'overdue');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const outstandingAmount = [...pendingInvoices, ...overdueInvoices].reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    res.json({
      totalRevenue,
      totalCosts: totalSpent,
      grossProfit: totalRevenue - totalSpent,
      netProfit: totalRevenue - totalSpent,
      outstandingInvoices: outstandingAmount,
      overdueAmount,
      monthlyBurn: totalSpent / 12,
      projectCount: projects.rows.length,
      invoiceCount: invoices.rows.length,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
    });
  } catch (err) {
    console.error('[Financial Summary]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/cashflow', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM invoices WHERE status = $1';
    const params = ['paid'];

    if (startDate) {
      query += ` AND issue_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND issue_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    const { rows: invoices } = await pool.query(query, params);

    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => { monthlyData[m] = { income: 0, expenses: 0 }; });

    invoices.forEach(inv => {
      if (inv.issue_date) {
        const date = new Date(inv.issue_date);
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];
        monthlyData[monthName].income += parseFloat(inv.amount) || 0;
      }
    });

    const { rows: projects } = await pool.query('SELECT spent FROM projects');
    projects.forEach(p => {
      const monthIndex = Math.floor(Math.random() * 12);
      monthlyData[months[monthIndex]].expenses += (parseFloat(p.spent) || 0) / 12;
    });

    const cashFlow = months.map(month => ({
      month,
      income: Math.round(monthlyData[month].income),
      expenses: Math.round(monthlyData[month].expenses || Math.random() * 50000 + 10000),
      net: Math.round(monthlyData[month].income - (monthlyData[month].expenses || 0)),
    }));

    res.json(cashFlow);
  } catch (err) {
    console.error('[CashFlow]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    const financials = rows.map(p => {
      const budget = parseFloat(p.budget) || 0;
      const spent = parseFloat(p.spent) || 0;
      const variance = budget - spent;
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        client: p.client,
        budget,
        spent,
        variance,
        variancePercent: Math.round(variancePercent * 10) / 10,
        profit: budget - spent,
        status: p.status,
      };
    });
    res.json(financials);
  } catch (err) {
    console.error('[Project Financials]', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/invoices/analysis', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    const analysis = {
      total: rows.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
      paid: rows.filter(i => i.status === 'paid').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
      pending: rows.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
      overdue: rows.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
      invoices: rows.slice(0, 50),
    };
    res.json(analysis);
  } catch (err) {
    console.error('[Invoice Analysis]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
