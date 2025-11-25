import { API_BASE, IDENTITY_BASE } from './config';
import type {
  AuthenticateResponse,
  OrderDto,
  OrderItemPayload,
  PaymentChargeResponse,
  PaymentDetails,
  StorefrontSnapshot,
  UserProfile,
} from './types';

export async function fetchStorefront(userId?: string) {
  const url = new URL(`${API_BASE}/storefront/home`);
  if (userId) {
    url.searchParams.set('userId', userId);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to load storefront data');
  }

  const data = (await res.json()) as {
    profile?: UserProfile | null;
    categories: StorefrontSnapshot['categories'];
    featured: StorefrontSnapshot['featured'];
    deals: StorefrontSnapshot['deals'];
  };

  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${IDENTITY_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Invalid credentials');
  }

  return (await res.json()) as AuthenticateResponse;
}

export async function register(
  email: string,
  password: string,
  fullName: string,
) {
  const res = await fetch(`${IDENTITY_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });

  if (!res.ok) {
    throw new Error('Registration failed');
  }

  return (await res.json()) as AuthenticateResponse;
}

export async function checkout(
  userId: string,
  items: OrderItemPayload[],
  shippingAddress: string,
) {
  const res = await fetch(`${API_BASE}/storefront/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, items, shippingAddress }),
  });

  if (!res.ok) {
    throw new Error('Checkout failed');
  }

  return (await res.json()) as OrderDto;
}

export async function chargePayment(
  amount: number,
  details: PaymentDetails,
  currency: string = 'USD',
) {
  const res = await fetch(`${API_BASE}/payments/charge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency,
      cardHolder: details.cardHolder,
      cardNumber: details.cardNumber,
      expiry: details.expiry,
      cvv: details.cvv,
      email: details.email,
    }),
  });

  if (!res.ok) {
    throw new Error('Payment authorization failed.');
  }

  return (await res.json()) as PaymentChargeResponse;
}

