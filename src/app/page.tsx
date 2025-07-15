'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, Typography, List, ListItem, ListItemText, Box, Paper, TableContainer, Table, TableHead, TableRow, TableBody, Button, TableCell, Card, CardContent } from '@mui/material';

export default function HomePage() {
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/expenses')
      .then((res) => res.json())
      .then((data) => {
        setRecurringExpenses(data.filter((exp: any) => exp.recurring !== 'one_time'));
      });

    fetch('/api/tenants')
      .then((res) => res.json())
      .then((data) => setTenants(data));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getTenantMonthlyPay = (tenant: any) => {
    if (!tenant.monthlyPayHistory || tenant.monthlyPayHistory.length === 0) {
      return 0;
    }
    // Sort by startDate descending to get the latest entry
    const sortedHistory = [...tenant.monthlyPayHistory].sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    const latestEntry = sortedHistory[0];
    return latestEntry.rent + latestEntry.heatingCost + latestEntry.additionalCost;
  };

  const totalMonthlyRent = tenants.reduce((sum, tenant) => sum + getTenantMonthlyPay(tenant), 0);
  const totalRecurringExpensesAmount = recurringExpenses.reduce((sum, exp) => {
    const latestAmount = exp.amountHistory?.[exp.amountHistory.length - 1]?.amount || 0;
    return sum + latestAmount;
  }, 0);

  return (
    <Container>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 3, p: 2 }}>
        <Typography variant="h1" sx={{ color: 'primary.main', minWidth: '288px' }}>Dashboard</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2 }}>
        <Card sx={{ flex: 1, minWidth: '158px', p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Total Monthly Payments</Typography>
          <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 700 }}>{formatCurrency(totalMonthlyRent)}</Typography>
        </Card>
        <Card sx={{ flex: 1, minWidth: '158px', p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Total Recurring Expenses</Typography>
          <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 700 }}>{formatCurrency(totalRecurringExpensesAmount)}</Typography>
        </Card>
        <Card sx={{ flex: 1, minWidth: '158px', p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Monthly Surplus</Typography>
          <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 700 }}>{formatCurrency((totalMonthlyRent - totalRecurringExpensesAmount) / 12)}</Typography>
        </Card>
      </Box>

      <Typography variant="h2" sx={{ color: 'primary.main', pt: 2, pb: 1, px: 2 }}>Tenant Overview</Typography>
      <Box sx={{ px: 2, py: 1 }}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table aria-label="tenant overview table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Tenant</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Unit</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Rent</TableCell>
                <TableCell sx={{ width: '240px', color: 'secondary.main', fontSize: '14px', fontWeight: 500 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 400 }}>
                    {tenant.name}
                  </TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>Unit N/A</TableCell> {/* Placeholder for Unit */}
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{formatCurrency(getTenantMonthlyPay(tenant))}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 700 }}>
                    <Link href={`/tenants/${tenant.id}/edit`} passHref>
                      <Button variant="text" sx={{ textTransform: 'none', fontWeight: 700, color: 'secondary.main' }}>View Details</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Typography variant="h2" sx={{ color: 'primary.main', pt: 2, pb: 1, px: 2 }}>Expense Overview</Typography>
      <Box sx={{ px: 2, py: 1 }}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table aria-label="expense overview table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Expense</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>How to Pay</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Amount</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Due Date</TableCell>
                <TableCell sx={{ width: '240px', color: 'secondary.main', fontSize: '14px', fontWeight: 500 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recurringExpenses.map((expense) => (
                <TableRow key={expense.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 400 }}>
                    {expense.description}
                  </TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{expense.paymentMethod}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{formatCurrency(expense.amountHistory?.[expense.amountHistory.length - 1]?.amount || 0)}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{expense.recurringDate || expense.date}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 700 }}>
                    <Link href={`/expenses/${expense.id}/edit`} passHref>
                      <Button variant="text" sx={{ textTransform: 'none', fontWeight: 700, color: 'secondary.main' }}>View Details</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
