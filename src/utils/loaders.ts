import * as cheerio from 'cheerio';
import pdf from 'pdf-parse';

export async function loadWebContent(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // removing script and style elements
  $('script, style').remove();
  
  // getting only text content
  return $('body').text().trim();
}

export async function loadPDFContent(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}
