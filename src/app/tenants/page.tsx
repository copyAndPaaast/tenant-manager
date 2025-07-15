'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container, Typography, Button, Box, Paper, TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    const fetchTenantsAndFlats = async () => {
      const [tenantsRes, flatsRes] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/flats'),
      ]);
      const tenantsData = await tenantsRes.json();
      const flatsData = await flatsRes.json();

      const tenantsWithFlatNames = tenantsData.map((tenant: any) => ({
        ...tenant,
        flatName: flatsData.find((flat: any) => flat.id === tenant.flatId)?.name,
      }));
      setTenants(tenantsWithFlatNames);
    };
    fetchTenantsAndFlats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getTenantMonthlyPay = (tenant: any) => {
    if (!tenant.monthlyPayHistory || tenant.monthlyPayHistory.length === 0) {
      return 0;
    }
    // Sort by startDate descending to get the latest entry
    const sortedHistory = [...tenant.monthlyPayHistory].sort((a, b) => {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    const latestEntry = sortedHistory[0];
    return latestEntry.rent + latestEntry.heatingCost + latestEntry.additionalCost;
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Tenants
        </Typography>
        <Button variant="contained" color="primary" component={Link} href="/tenants/new">
          Add Tenant
        </Button>
      </Box>
      <Box sx={{ px: 2, py: 1 }}>
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Table aria-label="tenant overview table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Tenant</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Unit</TableCell>
                <TableCell sx={{ width: '400px', color: 'primary.main', fontSize: '14px', fontWeight: 500 }}>Rent</TableCell>
                <TableCell sx={{ width: '240px', color: 'secondary.main', fontSize: '14px', fontWeight: 500 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant: any) => (
                <TableRow key={tenant.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontSize: '14px', fontWeight: 400 }}>
                    {tenant.name}
                  </TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>Unit N/A</TableCell> {/* Placeholder for Unit */}
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 400 }}>{formatCurrency(getTenantMonthlyPay(tenant))}</TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontSize: '14px', fontWeight: 700 }}>
                    <Link href={`/tenants/${tenant.id}/edit`} passHref>
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
