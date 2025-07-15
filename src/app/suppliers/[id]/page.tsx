'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Typography, Button, Grid, Box, Paper, List, ListItem, ListItemText, IconButton, Divider, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { File, UploadSimple } from '@phosphor-icons/react';

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [supplier, setSupplier] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSupplierData = useCallback(async () => {
    if (id) {
      const res = await fetch(`/api/suppliers/${id}`);
      const data = await res.json();
      setSupplier(data);
    }
  }, [id]);

  useEffect(() => {
    fetchSupplierData();
  }, [fetchSupplierData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`/api/suppliers/${id}/documents`, {
        method: 'POST',
        body: formData,
      });
      fetchSupplierData();
    }
  };

  if (!supplier) {
    return <p>Loading...</p>;
  }

  return (
    <Container maxWidth="lg">
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/suppliers" sx={{ textDecoration: 'none', color: 'inherit' }}>
          Suppliers
        </MuiLink>
        <Typography color="text.primary">{supplier.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Supplier Details
        </Typography>
        <Button variant="contained" onClick={() => router.push(`/suppliers/${id}/edit`)}>
          Edit
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Contact</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}><Typography variant="subtitle2">Name</Typography></Grid>
              <Grid size={{ xs: 8 }}><Typography variant="body2">{supplier.name}</Typography></Grid>
              <Grid size={{ xs: 4 }}><Typography variant="subtitle2">Email</Typography></Grid>
              <Grid size={{ xs: 8 }}><Typography variant="body2">{supplier.email}</Typography></Grid>
              <Grid size={{ xs: 4 }}><Typography variant="subtitle2">Phone</Typography></Grid>
              <Grid size={{ xs: 8 }}><Typography variant="body2">{supplier.phone}</Typography></Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Services</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2">{supplier.services}</Typography>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Payment Terms</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}><Typography variant="subtitle2">Payment Method</Typography></Grid>
              <Grid size={{ xs: 8 }}><Typography variant="body2">{supplier.paymentMethod}</Typography></Grid>
              <Grid size={{ xs: 4 }}><Typography variant="subtitle2">Payment Terms</Typography></Grid>
              <Grid size={{ xs: 8 }}><Typography variant="body2">{supplier.paymentTerms}</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>Documents & Contracts</Typography>
              <Button
                variant="outlined"
                startIcon={<UploadSimple />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <List>
              {(supplier.documents || []).map((doc: any) => (
                <ListItem key={doc.id} secondaryAction={<Button href={`/api/documents/${doc.id}`} target="_blank">View</Button>}>
                  <IconButton><File /></IconButton>
                  <ListItemText primary={doc.name} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notes History</Typography>
            <Divider sx={{ my: 2 }} />
            <List>
              {(supplier.notes || []).map((note: any) => (
                <ListItem key={note.id}>
                  <ListItemText primary={note.title} secondary={`${note.content} - ${new Date(note.date).toLocaleDateString()}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}