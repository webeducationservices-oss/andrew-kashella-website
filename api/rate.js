export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      rate: 6.87,
      date: new Date().toISOString().split('T')[0],
      source: 'estimate',
      note: 'Add FRED_API_KEY env variable for live Freddie Mac rates'
    });
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=MORTGAGE30US&api_key=${apiKey}&limit=5&sort_order=desc&file_type=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('FRED API error');

    const data = await response.json();
    // Find most recent non-missing observation
    const obs = data.observations.find(o => o.value !== '.');
    if (!obs) throw new Error('No valid observation');

    return res.status(200).json({
      rate: parseFloat(obs.value),
      date: obs.date,
      source: 'Freddie Mac Primary Mortgage Market Survey via FRED'
    });
  } catch (err) {
    return res.status(200).json({
      rate: 6.87,
      date: new Date().toISOString().split('T')[0],
      source: 'estimate'
    });
  }
}
