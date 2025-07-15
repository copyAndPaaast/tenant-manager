'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Paper } from '@mui/material';

export default function NewFlatPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await fetch('/api/flats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, notes: notes.split('\n').map((note: string) => ({ id: Date.now().toString(), date: new Date().toISOString(), note })) }),
    });

    if (res.ok) {
      router.push('/flats');
    } else {
      // Handle error
      console.error('Failed to create flat');
    }
  };

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add New Flat
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          label="Flat Name"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          label="Description (where it is)"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
        />
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            Add Flat
          </Button>
          <Button variant="outlined" onClick={() => router.push('/flats')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}