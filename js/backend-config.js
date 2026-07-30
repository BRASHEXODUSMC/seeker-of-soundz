// Public browser-safe configuration only. Never place Stripe, database, or service-role secrets here.
window.SOS_BACKEND = {
  mode: 'supabase',
  // Example: 'https://api.your-domain.com'. Leave blank for local-only preview mode.
  apiBaseUrl: '',
  // Optional hosted checkout fallback. A server-created Checkout Session is preferred.
  vipPaymentLink: '',
  supabaseUrl: 'https://cuocafmdmqgxtjgnopgk.supabase.co',
  supabaseAnonKey: 'sb_publishable_CvTiB8I9XuINZM9AZ0w16A_XplkdXwS',
  formspreeEndpoint: ''
};
