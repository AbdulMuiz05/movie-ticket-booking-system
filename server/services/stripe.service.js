import Stripe from 'stripe';

let _stripe = null;

export const getStripe = () => {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
};

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export const getCurrency = () => (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();