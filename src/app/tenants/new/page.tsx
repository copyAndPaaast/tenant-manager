'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, MenuItem } from '@mui/material';

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [flats, setFlats] = useState([]);
  const [selectedFlatId, setSelectedFlatId] = useState('');

  useEffect(() => {
    fetch('/api/flats')
      .then((res) => res.json())
      .then((data) => setFlats(data));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, flatId: selectedFlatId }),
    });

    if (res.ok) {
      router.push('/tenants');
    } else {
      // Handle error
      console.error('Failed to create tenant');
    }
  };

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Tenant
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          label="Tenant Name"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          select
          label="Select Flat"
          variant="outlined"
          fullWidth
          value={selectedFlatId}
          onChange={(e) => setSelectedFlatId(e.target.value)}
          margin="normal"
        >
          {flats.map((flat: any) => (
            <MenuItem key={flat.id} value={flat.id}>
              {flat.name}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            Add Tenant
          </Button>
          <Button variant="outlined" onClick={() => router.push('/tenants')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}