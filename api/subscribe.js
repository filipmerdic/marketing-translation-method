const CONVERTKIT_FORM_ID = 9078055;
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY || '29ELJMg_XqKQrJmJj0Acfw';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { email, first_name, last_name, job_title } = body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const payload = {
      api_key: CONVERTKIT_API_KEY,
      email,
      first_name: first_name || '',
      fields: {
        last_name: last_name || '',
        job_title: job_title || ''
      }
    };

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json(data);
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
