'use client';

import React from 'react';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Container, Box, List, ListItem, ListItemText } from '@mui/material';
import { Users, CurrencyDollar, Truck, Gear } from '@phosphor-icons/react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      minHeight: '100vh',
      bgcolor: 'background.default',
      fontFamily: '"Inter", "Noto Sans", sans-serif',
    }}>
      {/* Left Sidebar */}
      <Box sx={{
        width: { xs: '100%', md: '280px' },
        flexShrink: 0,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: 'background.default',
      }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 500 }}>Property Manager</Typography>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <ListItem disablePadding sx={{ borderRadius: '8px', bgcolor: '#e9edf1' }}>
            <Button component={Link} href="/" sx={{ width: '100%', justifyContent: 'flex-start', p: '8px 12px', gap: '12px' }}>
              <Users size={24} color="#101519" />
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Overview</Typography>
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ borderRadius: '8px' }}>
            <Button component={Link} href="/tenants" sx={{ width: '100%', justifyContent: 'flex-start', p: '8px 12px', gap: '12px' }}>
              <Users size={24} color="#101519" />
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Tenant Overview</Typography>
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ borderRadius: '8px' }}>
            <Button component={Link} href="/flats" sx={{ width: '100%', justifyContent: 'flex-start', p: '8px 12px', gap: '12px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path
                          d="M239.73,208H224V96a16,16,0,0,0-16-16H164a4,4,0,0,0-4,4V208H144V32.41a16.43,16.43,0,0,0-6.16-13,16,16,0,0,0-18.72-.69L39.12,72A16,16,0,0,0,32,85.34V208H16.27A8.18,8.18,0,0,0,8,215.47,8,8,0,0,0,16,224H240a8,8,0,0,0,8-8.53A8.18,8.18,0,0,0,239.73,208ZM76,184a8,8,0,0,1-8.53,8A8.18,8.18,0,0,1,60,183.72V168.27A8.19,8.19,0,0,1,67.47,160,8,8,0,0,1,76,168Zm0-56a8,8,0,0,1-8.53,8A8.19,8.19,0,0,1,60,127.72V112.27A8.19,8.19,0,0,1,67.47,104,8,8,0,0,1,76,112Zm40,56a8,8,0,0,1-8.53,8,8.18,8.18,0,0,1-7.47-8.26V168.27a8.19,8.19,0,0,1,7.47-8.26,8,8,0,0,1,8.53,8Zm0-56a8,8,0,0,1-8.53,8,8.19,8.19,0,0,1-7.47-8.26V112.27a8.19,8.19,0,0,1,7.47-8.26,8,8,0,0,1,8.53,8Z"
                        ></path>
                      </svg>
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Flat Overview</Typography>
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ borderRadius: '8px' }}>
            <Button component={Link} href="/expenses" sx={{ width: '100%', justifyContent: 'flex-start', p: '8px 12px', gap: '12px' }}>
              <CurrencyDollar size={24} color="#101519" />
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Expense Overview</Typography>
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ borderRadius: '8px' }}>
            <Button component={Link} href="/suppliers" sx={{ width: '100%', justifyContent: 'flex-start', p: '8px 12px', gap: '12px' }}>
              <Truck size={24} color="#101519" />
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Supplier Overview</Typography>
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ borderRadius: '8px' }}>
            <Button component={Link} href="/admin" sx={{ width: '100%', justifyContent: 'flex-start', p: '8px 12px', gap: '12px' }}>
              <Gear size={24} color="#101519" />
              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 500 }}>Admin Panel</Typography>
            </Button>
          </ListItem>
        </List>
      </Box>

      {/* Main Content Area */}
      <Box sx={{
        flexGrow: 1,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {children}
      </Box>
    </Box>
  );
}
