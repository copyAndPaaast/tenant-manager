'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Paper } from '@mui/material';

export default function FlatDetailPage({ params }: { params: Promise<{id:string}>}) {
  const router = useRouter();
  const [flat, setFlat] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [flatId, setFlatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { id } = await params;
      setFlatId(id);
      if (id) {
        fetch(`/api/flats/${id}`)
          .then((res) => res.json())
          .then((data) => {
            setFlat(data);
            setName(data.name);
            setDescription(data.description);
            setNotes(data.notes);
          });
      }
    };
    fetchData();
  }, [params]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!flatId) return;
    const res = await fetch(`/api/flats/${flatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description, newNote }),
    });

    if (res.ok) {
      router.push('/flats');
    } else {
      // Handle error
      console.error('Failed to update flat');
    }
  };

  const handleDelete = async () => {
    if (!flatId) return;
    const res = await fetch(`/api/flats/${flatId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/flats');
    } else {
      // Handle error
      console.error('Failed to delete flat');
    }
  };

  if (!flat) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Flat
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
        <TextField
          label="Add New Note"
          variant="outlined"
          fullWidth
          multiline
          rows={2}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          margin="normal"
        />
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            Save Changes
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleDelete}>
            Delete Flat
          </Button>
          <Button variant="outlined" onClick={() => router.push('/flats')}>
            Cancel
          </Button>
        </Box>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Note History</Typography>
        {notes.length === 0 ? (
          <Typography>No notes yet.</Typography>
        ) : (
          notes.map((note: any) => (
            <Paper key={note.id} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
              <Typography variant="body2" color="text.secondary">{new Date(note.date).toLocaleString()}</Typography>
              <Typography variant="body1">{note.note}</Typography>
            </Paper>
          ))
        )}
      </Box>
    </Container>
  );
}