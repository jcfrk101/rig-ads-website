import React, { FormEvent, useState } from 'react'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import MarketingPageShell from '../components/MarketingPageShell'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.bigrig.app'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function SubscribePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return

    if (!email.trim()) {
      setStatus('error')
      setErrorMessage('Please enter your email address.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch(`${API_URL}/marketing/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: 'website',
        }),
      })

      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again in a moment.')
    }
  }

  if (status === 'success') {
    return (
      <MarketingPageShell
        pageTitle="You're subscribed — RIG"
        pageDescription="You've been added to the RIG mailing list."
      >
        <Box style={{ textAlign: 'center' }}>
          <Box
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(10,220,106,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <Typography style={{ color: '#0ADC6A', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>✓</Typography>
          </Box>
          <Typography component="h1" style={{ color: '#1a1a2e', fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px' }}>
            You&apos;re all set!
          </Typography>
          <Typography style={{ color: '#4a4a5a', fontSize: '1rem', lineHeight: 1.6 }}>
            Thanks for subscribing. You&apos;ll start receiving RIG updates, offers, and roadside tips at{' '}
            <strong>{email.trim().toLowerCase()}</strong>.
          </Typography>
        </Box>
      </MarketingPageShell>
    )
  }

  return (
    <MarketingPageShell
      pageTitle="Subscribe to RIG updates"
      pageDescription="Get RIG news, offers, and roadside assistance tips delivered to your inbox."
    >
      <Typography
        style={{
          color: '#0ADC6A',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        Stay in the loop
      </Typography>
      <Typography component="h1" style={{ color: '#1a1a2e', fontSize: '1.85rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
        Subscribe to RIG
      </Typography>
      <Typography style={{ color: '#4a4a5a', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
        Get product updates, exclusive offers, and roadside assistance tips. No spam — unsubscribe anytime.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoComplete="name"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          autoComplete="tel"
        />

        {status === 'error' && (
          <Typography style={{ color: '#d32f2f', fontSize: '0.85rem' }}>{errorMessage}</Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={status === 'submitting'}
          style={{ padding: '14px 24px', fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}
        >
          {status === 'submitting' ? <CircularProgress size={24} style={{ color: '#000' }} /> : 'Subscribe'}
        </Button>

        <Typography style={{ color: '#8a8a9a', fontSize: '0.75rem', lineHeight: 1.5, textAlign: 'center', marginTop: '4px' }}>
          By subscribing you agree to receive marketing emails from RIG. You can{' '}
          <a href="/unsubscribe" style={{ color: '#4a4a5a', textDecoration: 'underline' }}>
            unsubscribe
          </a>{' '}
          at any time.
        </Typography>
      </Box>
    </MarketingPageShell>
  )
}
