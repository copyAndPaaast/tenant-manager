'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, Typography, Button, Box, Paper, TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material';

export default function FlatsPage() {
  const [flats, setFlats] = useState([]);

  useEffect(() => {
    fetch('/api/flats')
      .then((res) => res.json())
      .then((data) => setFlats(data));
  }, []);

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Flats
        </Typography>
        <Button variant="contained" color="primary" component={Link} href="/flats/new">
          Add Flat
        </Button>
      </Box>
      <Box sx={{ px: 2, py: 1 }}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table aria-label="flats overview table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Flat Name</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Description</TableCell>
                <TableCell sx={{ width: '240px', color: 'secondary.main', fontSize: '14px', fontWeight: 500 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flats.map((flat: any) => (
                <TableRow key={flat.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 400 }}>
                    {flat.name}
                  </TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{flat.description}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 700 }}>
                    <Link href={`/flats/${flat.id}`} passHref>
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
