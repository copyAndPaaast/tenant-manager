'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, Typography, Button, Box, Paper, TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => setSuppliers(data));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Suppliers
        </Typography>
        <Button variant="contained" color="primary" component={Link} href="/suppliers/new">
          Add Supplier
        </Button>
      </Box>
      <Box sx={{ px: 2, py: 1 }}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table aria-label="suppliers table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Supplier</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Contact</TableCell>
                <TableCell sx={{ width: '240px', color: 'secondary.main', fontSize: '14px', fontWeight: 500 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier: any) => (
                <TableRow key={supplier.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 400 }}>
                    {supplier.name}
                  </TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{supplier.contactPerson || 'N/A'}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 700 }}>
                    <Link href={`/suppliers/${supplier.id}/edit`} passHref>
                      <Button variant="text" sx={{ textTransform: 'none', fontWeight: 700, color: 'secondary.main' }}>View Details</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}
