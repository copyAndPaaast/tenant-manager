'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Typography, TextField, Button, Grid, Box, Select, MenuItem, FormControl, InputLabel, IconButton, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function EditSupplier() {
  const params = useParams();
  const { id } = params;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [customFields, setCustomFields] = useState<any>({});
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const [communicationChannels, setCommunicationChannels] = useState<any[]>([]);
  const [newChannelType, setNewChannelType] = useState('phone');
  const [newChannelValue, setNewChannelValue] = useState('');
  const [supplierNotes, setSupplierNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newNoteDate, setNewNoteDate] = useState('');
  const [showAddChannelForm, setShowAddChannelForm] = useState(false);
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const router = useRouter();

  const fetchSupplierData = useCallback(async () => {
    if (id) {
      const supplierRes = await fetch(`/api/suppliers/${id}`);
      const supplierData = await supplierRes.json();
      setName(supplierData.name);
      setAddress(supplierData.address || '');
      setCommunicationChannels(supplierData.communicationChannels || []);
      setSupplierNotes(supplierData.supplierNotes || []);
      setCustomFields(supplierData.customFields || {});

      const fieldsRes = await fetch('/api/admin/fields/suppliers');
      const fieldsData = await fieldsRes.json();
      setFieldDefinitions(fieldsData);
    }
  }, [id]);

  useEffect(() => {
    fetchSupplierData();
  }, [fetchSupplierData]);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomFields((prev: any) => ({ ...prev, [fieldId]: value }));
  };

  const handleDeleteSupplier = async () => {
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    router.push('/suppliers');
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/suppliers/${id}/communication-channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: newChannelType, value: newChannelValue }),
    });
    setNewChannelType('phone');
    setNewChannelValue('');
    setShowAddChannelForm(false);
    fetchSupplierData();
  };

  const handleDeleteChannel = async (channelId: string) => {
    await fetch(`/api/suppliers/${id}/communication-channels/${channelId}`, { method: 'DELETE' });
    fetchSupplierData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/suppliers/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote, date: newNoteDate }),
    });
    setNewNote('');
    setNewNoteDate('');
    setShowAddNoteForm(false);
    fetchSupplierData();
  };

  const handleDeleteNote = async (noteId: string) => {
    await fetch(`/api/suppliers/${id}/notes/${noteId}`, { method: 'DELETE' });
    fetchSupplierData();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, customFields }),
    });
    router.push(`/suppliers/${id}/edit`);
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Supplier
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button type="submit" variant="contained" color="primary" form="edit-supplier-form">
          Save Changes
        </Button>
        <Button variant="contained" color="secondary" onClick={handleDeleteSupplier} sx={{ ml: 2 }}>
          Delete Supplier
        </Button>
      </Box>
      <form onSubmit={handleSubmit} id="edit-supplier-form">
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
              rows={3}
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
          </Grid>
      </form>

      <Card sx={{ mt: 4, mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Communication Channels</Typography>
          <List dense>
            {(communicationChannels || []).map((channel: any) => (
              <ListItem 
                key={channel.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteChannel(channel.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={`${channel.type}: ${channel.value}`}
                />
              </ListItem>
            ))}
          </List>
          {!showAddChannelForm && (
            <Button variant="outlined" onClick={() => setShowAddChannelForm(true)}>
              Add Communication Channel
            </Button>
          )}
          {showAddChannelForm && (
            <form onSubmit={handleAddChannel}>
              <Grid container spacing={2}>
                <Grid size={{sm:12, md:4}}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={newChannelType}
                      label="Type"
                      onChange={(e) => setNewChannelType(e.target.value as string)}
                    >
                      <MenuItem value="phone">Phone</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="website">Website</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{sm:12, md:8}}>
                  <TextField
                    label="Value"
                    value={newChannelValue}
                    onChange={(e) => setNewChannelValue(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" color="primary">
                  Save Channel
                </Button>
                <Button variant="outlined" onClick={() => setShowAddChannelForm(false)} sx={{ ml: 2 }}>
                  Cancel
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mt: 4, mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Supplier Notes</Typography>
          <List dense>
            {(supplierNotes || []).map((note: any) => (
              <ListItem 
                key={note.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteNote(note.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={note.note} 
                  secondary={`Date: ${note.date}`}
                />
              </ListItem>
            ))}
          </List>
          {!showAddNoteForm && (
            <Button variant="outlined" onClick={() => setShowAddNoteForm(true)}>
              Add Note
            </Button>
          )}
          {showAddNoteForm && (
            <form onSubmit={handleAddNote}>
              <Grid container spacing={2}>
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
        </CardContent>
      </Card>
    </Container>
  );
}