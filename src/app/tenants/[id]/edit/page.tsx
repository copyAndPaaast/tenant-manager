'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Typography, TextField, Button, Grid, Box, 
  IconButton,Paper, TableContainer,TableBody,TableRow , TableCell, Table, TableHead} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function EditTenant() {
  const params = useParams();
  const { id } = params;
  const [tenant, setTenant] = useState<any>(null); // Central tenant state
  const [customFields, setCustomFields] = useState<any>({});
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);

  // States for Monthly Pay History form
  const [newRent, setNewRent] = useState('');
  const [newHeatingCost, setNewHeatingCost] = useState('');
  const [newAdditionalCost, setNewAdditionalCost] = useState('');
  const [newPayStartDate, setNewPayStartDate] = useState('');
  const [newPayEndDate, setNewPayEndDate] = useState('');
  const [showAddPayForm, setShowAddPayForm] = useState(false);

  // States for Notes form
  const [newNote, setNewNote] = useState('');
  const [newNoteDate, setNewNoteDate] = useState('');
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);

  const router = useRouter();

  const fetchTenantData = useCallback(async () => {
    if (id) {
      const tenantRes = await fetch(`/api/tenants/${id}`);
      const tenantData = await tenantRes.json();
      setTenant(tenantData); // Set the entire tenant object
      setCustomFields(tenantData.customFields || {}); // Initialize custom fields

      const fieldsRes = await fetch('/api/admin/fields');
      const fieldsData = await fieldsRes.json();
      setFieldDefinitions(fieldsData);
    }
  }, [id]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFields((prev: any) => ({ ...prev, [fieldId]: value }));
  };

  const handleDeleteTenant = async () => {
    await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
    router.push('/tenants');
  };

  const handleAddPayEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/tenants/${id}/monthly-pay-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rent: parseFloat(newRent),
        heatingCost: parseFloat(newHeatingCost),
        additionalCost: parseFloat(newAdditionalCost),
        startDate: newPayStartDate,
        endDate: newPayEndDate,
      }),
    });
    setNewRent('');
    setNewHeatingCost('');
    setNewAdditionalCost('');
    setNewPayStartDate('');
    setNewPayEndDate('');
    setShowAddPayForm(false);
    fetchTenantData(); // Re-fetch data to update the list
  };

  const handleDeletePayEntry = async (entryId: string) => {
    await fetch(`/api/tenants/${id}/monthly-pay-history/${entryId}`, { method: 'DELETE' });
    fetchTenantData(); // Re-fetch data to update the list
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/tenants/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote, date: newNoteDate }),
    });
    setNewNote('');
    setNewNoteDate('');
    setShowAddNoteForm(false);
    fetchTenantData(); // Re-fetch data to update the list
  };

  const handleDeleteNote = async (noteId: string) => {
    await fetch(`/api/tenants/${id}/notes/${noteId}`, { method: 'DELETE' });
    fetchTenantData(); // Re-fetch data to update the list
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tenant.name, customFields }), // Send updated name and custom fields
    });
    router.push(`/tenants/${id}/edit`); // Stay on edit page after save
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (!tenant) {
    return <p>Loading...</p>;
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', pb: 3 }}>
        <Box sx={{ flex: 1, minWidth: '288px' }}>
          <Typography variant="h1" sx={{ color: 'primary.main' }}>Tenant Details</Typography>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>View and manage tenant information</Typography>
        </Box>
        <Button variant="contained" color="primary" onClick={() => handleSubmit(new Event('submit') as unknown as React.FormEvent)}>
          Save Changes
        </Button>
        <Button variant="contained" color="secondary" onClick={handleDeleteTenant} sx={{ ml: 2 }}>
          Delete Tenant
        </Button>
      </Box>

      <form onSubmit={handleSubmit} id="edit-tenant-form">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={12}>
            <TextField
              label="Tenant Name"
              value={tenant.name}
              onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
              fullWidth
              required
            />
          </Grid>
          {fieldDefinitions.map((field) => (
            <Grid size={{sm: 12, md: field.type === 'text' ? 12 : 4}} key={field.id}>
              <TextField
                label={field.name}
                type={field.type === 'number' || field.type === 'currency' ? 'number' : field.type}
                value={customFields[field.id] || ''}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                fullWidth
                rows={field.type === 'text' ? 2 : 1}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
              />
            </Grid>
          ))}
        </Grid>
      </form>

      <Typography variant="h2" sx={{ color: 'primary.main', pt: 2, pb: 1 }}>Contact Information</Typography>
      <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '20% 1fr' }, gap: '1.5rem' }}>
        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' }, borderTop: '1px solid', borderColor: 'border.main', py: 2 }}>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>Phone</Typography>
          <Typography variant="body1">{tenant.contact?.phone || 'N/A'}</Typography>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' }, borderTop: '1px solid', borderColor: 'border.main', py: 2 }}>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>Email</Typography>
          <Typography variant="body1">{tenant.contact?.email || 'N/A'}</Typography>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' }, borderTop: '1px solid', borderColor: 'border.main', py: 2 }}>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>Address</Typography>
          <Typography variant="body1">{tenant.contact?.address || 'N/A'}</Typography>
        </Box>
      </Box>

      <Typography variant="h2" sx={{ color: 'primary.main', pt: 2, pb: 1 }}>Monthly Pay History</Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'border.main', borderRadius: '12px' }}>
        <Table aria-label="monthly pay history table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '150px' }}>Start Date</TableCell>
              <TableCell sx={{ width: '150px' }}>End Date</TableCell>
              <TableCell align="right">Rent</TableCell>
              <TableCell align="right">Heating</TableCell>
              <TableCell align="right">Additional</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell sx={{ width: '100px' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tenant.monthlyPayHistory || []).map((entry: any) => (
              <TableRow key={entry.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ color: 'secondary.main' }}>{entry.startDate}</TableCell>
                <TableCell sx={{ color: 'secondary.main' }}>{entry.endDate || 'Current'}</TableCell>
                <TableCell align="right" sx={{ color: 'secondary.main' }}>{formatCurrency(entry.rent)}</TableCell>
                <TableCell align="right" sx={{ color: 'secondary.main' }}>{formatCurrency(entry.heatingCost)}</TableCell>
                <TableCell align="right" sx={{ color: 'secondary.main' }}>{formatCurrency(entry.additionalCost)}</TableCell>
                <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 700 }}>{formatCurrency(entry.rent + entry.heatingCost + entry.additionalCost)}</TableCell>
                <TableCell align="right">
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeletePayEntry(entry.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!showAddPayForm && (
        <Button variant="outlined" onClick={() => setShowAddPayForm(true)} sx={{ mt: 2 }}>
          Add Monthly Pay Entry
        </Button>
      )}
      {showAddPayForm && (
        <form onSubmit={handleAddPayEntry}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Rent Amount"
                value={newRent}
                onChange={(e) => setNewRent(e.target.value)}
                type="number"
                fullWidth
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Heating Cost"
                value={newHeatingCost}
                onChange={(e) => setNewHeatingCost(e.target.value)}
                type="number"
                fullWidth
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Additional Cost"
                value={newAdditionalCost}
                onChange={(e) => setNewAdditionalCost(e.target.value)}
                type="number"
                fullWidth
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="Start Date"
                value={newPayStartDate}
                onChange={(e) => setNewPayStartDate(e.target.value)}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid size={{sm:12, md:4}}>
              <TextField
                label="End Date"
                value={newPayEndDate}
                onChange={(e) => setNewPayEndDate(e.target.value)}
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Monthly Pay Entry
            </Button>
            <Button variant="outlined" onClick={() => setShowAddPayForm(false)} sx={{ ml: 2 }}>
              Cancel
            </Button>
          </Box>
        </form>
      )}

      <Typography variant="h2" sx={{ color: 'primary.main', pt: 2, pb: 1 }}>Notes History</Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'border.main', borderRadius: '12px' }}>
        <Table aria-label="notes history table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '150px' }}>Date</TableCell>
              <TableCell>Note</TableCell>
              <TableCell sx={{ width: '100px' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tenant.notes || []).map((note: any) => (
              <TableRow key={note.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
        <Button variant="outlined" onClick={() => setShowAddNoteForm(true)} sx={{ mt: 2 }}>
          Add Note
        </Button>
      )}
      {showAddNoteForm && (
        <form onSubmit={handleAddNote}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
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
          <Box sx={{ mt: 2 }}>
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
