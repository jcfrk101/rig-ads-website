import React, { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import MarketingPageShell from '../components/MarketingPageShell'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.bigrig.app'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function UnsubscribePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Prefill from ?email= so links in marketing emails can deep-link the address.
  useEffect(() => {
    if (!router.isReady) return
    const queryEmail = router.query.email
    if (typeof queryEmail === 'string' && queryEmail) setEmail(queryEmail)
  }, [router.isReady, router.query.email])

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
      const res = await fetch(`${API_URL}/marketing/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
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
        pageTitle="Unsubscribed — RIG"
        pageDescription="You've been removed from the RIG mailing list."
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
            You&apos;ve been unsubscribed
          </Typography>
          <Typography style={{ color: '#4a4a5a', fontSize: '1rem', lineHeight: 1.6 }}>
            <strong>{email.trim().toLowerCase()}</strong> will no longer receive marketing emails from RIG. We&apos;re
            sorry to see you go.
          </Typography>
          <Typography style={{ color: '#8a8a9a', fontSize: '0.85rem', lineHeight: 1.6, marginTop: '20px' }}>
            Changed your mind?{' '}
            <a href="/subscribe" style={{ color: '#0ADC6A', textDecoration: 'underline', fontWeight: 600 }}>
              Resubscribe here
            </a>
            .
          </Typography>
        </Box>
      </MarketingPageShell>
    )
  }

  return (
    <MarketingPageShell
      pageTitle="Unsubscribe from RIG emails"
      pageDescription="Remove your email address from the RIG mailing list."
    >
      <Typography
        style={{
          color: 'rgba(50,62,72,0.6)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}
      >
        Email preferences
      </Typography>
      <Typography component="h1" style={{ color: '#1a1a2e', fontSize: '1.85rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>
        Unsubscribe
      </Typography>
      <Typography style={{ color: '#4a4a5a', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
        Enter your email address below and we&apos;ll stop sending you marketing emails.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
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
          {status === 'submitting' ? <CircularProgress size={24} style={{ color: '#000' }} /> : 'Unsubscribe'}
        </Button>
      </Box>
    </MarketingPageShell>
  )
}
