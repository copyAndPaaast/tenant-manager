'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Supplier } from '@/lib/db';
import { useRouter, useParams } from 'next/navigation';
import { Container, Typography, TextField, Button, Grid, Box, Select, MenuItem, FormControl, InputLabel, IconButton,
  Table, TableBody, TableHead, TableCell, TableRow, TableContainer, Paper} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function EditExpense() {
  const params = useParams();
  const { id } = params;
  const [expense, setExpense] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any>([]);
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const [newAmount, setNewAmount] = useState('');
  const [newAmountStartDate, setNewAmountStartDate] = useState('');
  const [newAmountEndDate, setNewAmountEndDate] = useState('');
  const [showAddAmountForm, setShowAddAmountForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteDate, setNewNoteDate] = useState('');
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const router = useRouter();

  const fetchExpenseData = useCallback(async () => {
    if (id) {
      const expenseRes = await fetch(`/api/expenses/${id}`);
      const expenseData = await expenseRes.json();
      setExpense(expenseData);

      if (expenseData.supplierId) {
        const supplierRes = await fetch(`/api/suppliers/${expenseData.supplierId}`);
        const supplierData = await supplierRes.json();
        setSupplier(supplierData);
      }

      const fieldsRes = await fetch('/api/admin/fields/expenses');
      const fieldsData = await fieldsRes.json();
      setFieldDefinitions(fieldsData);
    }
  }, [id]);

  const fetchSuppliers = useCallback(async () => {
    const res = await fetch('/api/suppliers');
    const data = await res.json();
    setSuppliers(data);
  }, []);

  useEffect(() => {
    fetchExpenseData();
    fetchSuppliers();
  }, [fetchExpenseData, fetchSuppliers]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      router.push('/expenses');
    }
  };

  const handleAddAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/expenses/${id}/amount-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(newAmount), startDate: newAmountStartDate, endDate: newAmountEndDate }),
    });
    setNewAmount('');
    setNewAmountStartDate('');
    setNewAmountEndDate('');
    setShowAddAmountForm(false);
    fetchExpenseData();
  };

  const handleDeleteAmount = async (amountId: string) => {
    if (window.confirm('Are you sure you want to delete this amount entry?')) {
      await fetch(`/api/expenses/${id}/amount-history/${amountId}`, { method: 'DELETE' });
      fetchExpenseData();
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/expenses/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote, date: newNoteDate }),
    });
    setNewNote('');
    setNewNoteDate('');
    setShowAddNoteForm(false);
    fetchExpenseData();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await fetch(`/api/expenses/${id}/notes/${noteId}`, { method: 'DELETE' });
      fetchExpenseData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: expense.description,
        recurring: expense.recurring,
        recurringDate: expense.recurringDate,
        paymentMethod: expense.paymentMethod,
        supplierId: expense.supplierId,
        customFields: expense.customFields
      }),
    });
    router.push(`/expenses/${id}/edit`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (!expense) {
    return <p>Loading...</p>;
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', pb: 3 }}>
        <Box sx={{ flex: 1, minWidth: '288px' }}>
          <Typography variant="h1" sx={{ color: 'primary.main' }}>Expense Details</Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>View and manage expense information</Typography>
        </Box>
        <Button variant="contained" color="primary" type="submit" form="edit-expense-form">
          Save Changes
        </Button>
        <Button variant="contained" color="secondary" onClick={handleDelete} sx={{ ml: 2 }}>
          Delete Expense
        </Button>
      </Box>

      <form onSubmit={handleSubmit} id="edit-expense-form">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={12}>
            <TextField
              label="Description"
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{sm:12, md:3}}>
            <TextField
              label="Date"
              value={expense.date}
              onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              fullWidth
              required
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{sm:12, md:4}}>
            <FormControl fullWidth>
              <InputLabel>Recurring</InputLabel>
              <Select
                value={expense.recurring}
                label="Recurring"
                onChange={(e) => setExpense({ ...expense, recurring: e.target.value as string })}
              >
                <MenuItem value="one_time">One Time</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="certain_date">Certain Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {(expense.recurring === 'yearly' || expense.recurring === 'certain_date') && (
            <Grid size={{sm:12, md:4}}>
              <TextField
                label={expense.recurring === 'yearly' ? "Specific Date (MM-DD)" : "Specific Date (e.g., 15th, last day)"}
                value={expense.recurringDate || ''}
                onChange={(e) => setExpense({ ...expense, recurringDate: e.target.value })}
                type="text"
                fullWidth
                required
              />
            </Grid>
          )}
          {expense.recurring === 'quarterly' && (
             <Grid size={{sm:12, md:8}}>
              <TextField
                label="Quarterly Dates (e.g., 01/01, 04/01)"
                value={expense.recurringDate || ''}
                onChange={(e) => setExpense({ ...expense, recurringDate: e.target.value })}
                fullWidth
                multiline
                rows={2}
                required
              />
            </Grid>
          )}
          {expense.recurring === 'monthly' && (
             <Grid size={{sm:12, md:4}}>
              <TextField
                label="Day of Month (e.g., 15)"
                value={expense.recurringDate || ''}
                onChange={(e) => setExpense({ ...expense, recurringDate: e.target.value })}
                fullWidth
                required
              />
            </Grid>
          )}
          <Grid size={{sm:12, md:4}}>
            <TextField
              label="Payment Method"
              value={expense.paymentMethod}
              onChange={(e) => setExpense({ ...expense, paymentMethod: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{sm:12, md:4}}>
            <FormControl fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={expense.supplierId}
                label="Supplier"
                onChange={(e) => setExpense({ ...expense, supplierId: e.target.value as string })}
              >
                {suppliers.map((supplier: Supplier) => (
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
                value={expense.customFields?.[field.id] || ''}
                onChange={(e) => setExpense({ ...expense, customFields: { ...expense.customFields, [field.id]: e.target.value } })}
                fullWidth
                multiline={field.type === 'text'}
                rows={field.type === 'text' ? 2 : 1}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
              />
            </Grid>
          ))}
        </Grid>
      </form>

      <Typography variant="h3" sx={{ color: 'primary.main', pt: 2, pb: 1, px: 2 }}>Amount History</Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'border.main', borderRadius: '12px', mx: 2 }}>
        <Table aria-label="amount history table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ width: '150px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Start Date</TableCell>
              <TableCell sx={{ width: '150px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>End Date</TableCell>
              <TableCell align="right" sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Amount</TableCell>
              <TableCell sx={{ width: '100px' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(expense.amountHistory || []).map((entry: any) => (
              <TableRow key={entry.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                <TableCell sx={{ color: 'secondary.main' }}>{entry.startDate}</TableCell>
                <TableCell sx={{ color: 'secondary.main' }}>{entry.endDate || 'Current'}</TableCell>
                <TableCell align="right" sx={{ color: 'secondary.main' }}>{formatCurrency(entry.amount)}</TableCell>
                <TableCell align="right">
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteAmount(entry.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!showAddAmountForm && (
        <Button variant="outlined" onClick={() => setShowAddAmountForm(true)} sx={{ mt: 2, ml: 2 }}>
          Add New Amount
        </Button>
      )}
      {showAddAmountForm && (
        <form onSubmit={handleAddAmount}>
          <Grid container spacing={2} sx={{ mt: 2, mx: 2 }}>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                type="number"
                fullWidth
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Start Date"
                value={newAmountStartDate}
                onChange={(e) => setNewAmountStartDate(e.target.value)}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="End Date"
                value={newAmountEndDate}
                onChange={(e) => setNewAmountEndDate(e.target.value)}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, ml: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Amount Entry
            </Button>
            <Button variant="outlined" onClick={() => setShowAddAmountForm(false)} sx={{ ml: 2 }}>
              Cancel
            </Button>
          </Box>
        </form>
      )}

      <Typography variant="h3" sx={{ color: 'primary.main', pt: 2, pb: 1, px: 2 }}>Notes History</Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'border.main', borderRadius: '12px', mx: 2 }}>
        <Table aria-label="notes history table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell sx={{ width: '150px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Date</TableCell>
              <TableCell sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Note</TableCell>
              <TableCell sx={{ width: '100px' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(expense.notes || []).map((note: any) => (
              <TableRow key={note.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                <TableCell sx={{ color: 'secondary.main' }}>{note.date}</TableCell>
                <TableCell sx={{ color: 'secondary.main' }}>{note.note}</TableCell>
                <TableCell align="right">
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteNote(note.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!showAddNoteForm && (
        <Button variant="outlined" onClick={() => setShowAddNoteForm(true)} sx={{ mt: 2, ml: 2 }}>
          Add New Note
        </Button>
      )}
      {showAddNoteForm && (
        <form onSubmit={handleAddNote}>
          <Grid container spacing={2} sx={{ mt: 2, mx: 2 }}>
            <Grid size={12}>
              <TextField
                label="New Note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Note Date"
                value={newNoteDate}
                onChange={(e) => setNewNoteDate(e.target.value)}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, ml: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Note
            </Button>
            <Button variant="outlined" onClick={() => setShowAddNoteForm(false)} sx={{ ml: 2 }}>
              Cancel
            </Button>
          </Box>
        </form>
      )}
    </Container>
  );
}
