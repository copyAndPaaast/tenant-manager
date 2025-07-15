'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, Grid, Box } from '@mui/material';

export default function NewExpense() {
  const [description, setDescription] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [recurring, setRecurring] = useState('one_time');
  const [recurringDate, setRecurringDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any>({});
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => setSuppliers(data));

    fetch('/api/admin/fields/expenses')
      .then((res) => res.json())
      .then((data) => setFieldDefinitions(data));
  }, []);

  const handleCustomFieldChange = (id: string, value: any) => {
    setCustomFields((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        amount: parseFloat(initialAmount),
        recurring,
        recurringDate: recurring === 'certain_date' ? recurringDate : null,
        paymentMethod,
        supplierId,
        customFields
      }),
    });
    router.push('/expenses');
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Add New Expense
        </Typography>
        <Button type="submit" variant="contained" color="primary" form="new-expense-form">
          Add Expense
        </Button>
      </Box>
      <form onSubmit={handleSubmit} id="new-expense-form">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{sm:12, md:4}}>
            <TextField
              label="Initial Amount"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              fullWidth
              required
              type="number"
            />
          </Grid>
          {(recurring === 'yearly' || recurring === 'certain_date') && (
            <Grid size={{sm:12, md:4}}>
              <TextField
                label={recurring === 'yearly' ? "Specific Date (MM-DD)" : "Specific Date (e.g., 15th, last day)"}
                value={recurringDate}
                onChange={(e) => setRecurringDate(e.target.value)}
                type="text"
                fullWidth
                required
              />
            </Grid>
          )}
          {recurring === 'quarterly' && (
            <Grid size={{sm:12, md:8}}>
              <TextField
                label="Quarterly Dates (e.g., 01/01, 04/01)"
                value={recurringDate}
                onChange={(e) => setRecurringDate(e.target.value)}
                fullWidth
                multiline
                rows={2}
                required
              />
            </Grid>
          )}
          {recurring === 'monthly' && (
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Day of Month (e.g., 15)"
                value={recurringDate}
                onChange={(e) => setRecurringDate(e.target.value)}
                fullWidth
                required
              />
            </Grid>
          )}
          <Grid size={{sm:12, md:4}}>
            <TextField
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{sm:12, md:4}}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={supplierId}
                label="Supplier"
                onChange={(e) => setSupplierId(e.target.value as string)}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {fieldDefinitions.map((field) => (
            <Grid size={{sm: 12, md: field.type === 'text' ? 12 : 4}} key={field.id}>
              <TextField
                label={field.name}
                type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type}
                value={customFields[field.id] || ''}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                fullWidth
                multiline={field.type === 'text'}
                rows={field.type === 'text' ? 2 : 1}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
              />
            </Grid>
          ))}
          <Grid size={12}>
            <Button type="submit" variant="contained" color="primary">
              Add Expense
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}
