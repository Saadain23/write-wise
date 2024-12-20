import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
  try {
    const { url } = await request.json();
    
    console.log('Received URL:', url);
    
    if (!url || typeof url !== 'string') {
      console.log('Invalid URL provided');
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    console.log('Fetching URL...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('Fetch failed:', response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const text = await response.text();
    console.log('Successfully fetched text, length:', text.length);
    
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Server error loading URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load URL' },
      { status: 500 }
    );
  }
}
