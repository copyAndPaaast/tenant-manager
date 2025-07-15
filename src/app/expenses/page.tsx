'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, List, ListItem, ListItemText, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/expenses')
      .then((res) => res.json())
      .then((data) => setExpenses(data));
  }, []);

  const recurringExpenses = expenses.filter(exp => exp.recurring !== 'one_time');
  const oneTimeExpenses = expenses.filter(exp => exp.recurring === 'one_time');

  const totalRecurringAmount = recurringExpenses.reduce((sum, exp) => {
    const latestAmount = exp.amountHistory?.[exp.amountHistory.length - 1]?.amount || 0;
    return sum + latestAmount;
  }, 0);

  const oneTimeExpensesByYear = oneTimeExpenses.reduce((acc: { [key: string]: number }, exp) => {
    const year = new Date(exp.date).getFullYear().toString();
    const amount = exp.amountHistory?.[exp.amountHistory.length - 1]?.amount || 0;
    acc[year] = (acc[year] || 0) + amount;
    return acc;
  }, {});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Expenses Overview
        </Typography>
        <Button variant="contained" color="primary" component={Link} href="/expenses/new">
          Add Expense
        </Button>
      </Box>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Regelmäßige Ausgaben (Recurring Expenses)
      </Typography>
      {recurringExpenses.length > 0 ? (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="recurring expenses table">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Recurring Type</TableCell>
                  <TableCell align="right">Latest Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recurringExpenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {expense.description}
                    </TableCell>
                    <TableCell align="right">{expense.recurring === 'monthly' ? `Monthly (Day: ${expense.recurringDate})` : expense.recurring === 'quarterly' ? `Quarterly (Dates: ${expense.recurringDate})` : expense.recurring === 'yearly' ? `Yearly (Date: ${expense.recurringDate})` : expense.recurring === 'certain_date' ? `Certain Date (${expense.recurringDate})` : expense.recurring}</TableCell>
                    <TableCell align="right">{formatCurrency(expense.amountHistory?.[expense.amountHistory.length - 1]?.amount || 0)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" color="primary" component={Link} href={`/expenses/${expense.id}/edit`}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No recurring expenses found.</Typography>
        )}
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="h6">Total Recurring Amount: {formatCurrency(totalRecurringAmount)}</Typography>
      </Box>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Einmalige Ausgaben (One-Time Expenses) by Year
      </Typography>
      {Object.keys(oneTimeExpensesByYear).length > 0 ? (
        <Box>
          {Object.entries(oneTimeExpensesByYear).sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA)).map(([year, totalAmount]) => (
            <Box key={year} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Year {year}: {formatCurrency(totalAmount)}
              </Typography>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="one-time expenses table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {oneTimeExpenses.filter(exp => new Date(exp.date).getFullYear().toString() === year).map((expense) => (
                      <TableRow
                        key={expense.id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {expense.description}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(expense.amountHistory?.[expense.amountHistory.length - 1]?.amount || 0)}</TableCell>
                        <TableCell align="right">{new Date(expense.amountHistory?.[expense.amountHistory.length - 1]?.startDate).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button size="small" component={Link} href={`/expenses/${expense.id}/edit`}>Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography>No one-time expenses found.</Typography>
      )}
    </Container>
  );
}


