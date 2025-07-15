'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, TextField, Button, Grid, Box } from '@mui/material';

export default function NewSupplier() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [customFields, setCustomFields] = useState<any>({});
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/fields/suppliers')
      .then((res) => res.json())
      .then((data) => setFieldDefinitions(data));
  }, []);

  const handleCustomFieldChange = (id: string, value: any) => {
    setCustomFields((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Date.now().toString(), name, address, customFields }),
    });
    router.push('/suppliers');
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Add New Supplier
        </Typography>
        <Button type="submit" variant="contained" color="primary" form="new-supplier-form">
          Add Supplier
        </Button>
      </Box>
      <form onSubmit={handleSubmit} id="new-supplier-form">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={12}>
            <TextField
              label="Supplier Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{sm:12, md:8}}>
            <TextField
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              multiline
              rows={2}
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
                multiline={field.type === 'text'}
                rows={field.type === 'text' ? 2 : 1}
                InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
              />
            </Grid>
          ))}
          <Grid size={12}>
            <Button type="submit" variant="contained" color="primary">
              Add Supplier
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}
