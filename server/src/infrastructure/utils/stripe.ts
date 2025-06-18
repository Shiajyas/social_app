import stripePackage from 'stripe';

export const stripe = new stripePackage(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});
