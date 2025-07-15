'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, List, ListItem, ListItemText, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AdminPanel() {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [selectedCategory, setSelectedCategory] = useState('tenants');
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    fetchFields(selectedCategory);
  }, [selectedCategory]);

  const fetchFields = async (category: string) => {
    try {
      const res = await fetch(`/api/admin/fields/${category}`);
      if (!res.ok) {
        console.error(`HTTP error! status: ${res.status}`);
        setFields([]); // Clear fields on error
        return;
      }
      const data = await res.json();
      setFields(data);
    } catch (error) {
      console.error('Error fetching or parsing fields:', error);
      setFields([]); // Clear fields on error
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/admin/fields/${selectedCategory}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fieldName, type: fieldType }),
    });
    setFieldName('');
    setFieldType('text');
    fetchFields(selectedCategory);
  };

  const handleDeleteField = async (id: string) => {
    await fetch(`/api/admin/fields/${selectedCategory}/${id}`, {
      method: 'DELETE',
    });
    fetchFields(selectedCategory);
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Admin Panel - Custom Fields
        </Typography>
        <Button type="submit" variant="contained" color="primary" form="add-field-form">
          Add Field
        </Button>
      </Box>

      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select
          value={selectedCategory}
          label="Category"
          onChange={(e) => setSelectedCategory(e.target.value as string)}
        >
          <MenuItem value="tenants">Tenants</MenuItem>
          <MenuItem value="expenses">Expenses</MenuItem>
          <MenuItem value="suppliers">Suppliers</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Add New Field for {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
      </Typography>
      <form onSubmit={handleAddField} id="add-field-form">
        <TextField
          label="Field Name"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Field Type</InputLabel>
          <Select
            value={fieldType}
            label="Field Type"
            onChange={(e) => setFieldType(e.target.value as string)}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="currency">Currency</MenuItem>
            <MenuItem value="date">Date</MenuItem>
          </Select>
        </FormControl>
      </form>

      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Existing Fields for {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
      </Typography>
      <List>
        {fields.map((field) => (
          <ListItem
            key={field.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteField(field.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={field.name} secondary={`Type: ${field.type}`} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
