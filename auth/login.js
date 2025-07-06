import express from 'express';
import querystring from 'querystring';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';

dotenv.config();

const client_id = 'aaee9bf0dc8b48eab082319bb48d53bb';
const client_secret = 'c04e57e206d542478d6fedfe46c04959';
const redirect_uri = 'http://localhost:8888/callback';
const scopes = 'user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public';

async function login() {
  const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scopes,
    redirect_uri: redirect_uri
  });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(authUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('#login-username', { timeout: 60000 });
    await page.type('#login-username', 'tillage.planets0g@icloud.com');
    await page.type('#login-password', 'vysket-pewxek-wowbI6');
    await page.click('#login-button');

    console.log('logged in!');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Authorization page URL:', page.url());

    await browser.close();
    console.log('browser closed!');

    return true;
    
  } catch (error) {
    console.error('Error during Spotify login:', error);
  }
}

export default login;