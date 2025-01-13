import express from 'express';
import querystring from 'querystring';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';

dotenv.config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.SECRET;
const redirect_uri = process.env.REDIRECT_URI;
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
      headless: true, // Run in headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Disable sandboxing
      executablePath: '/usr/bin/chromium-browser' // Specify the path to Chromium
    });
    const page = await browser.newPage();
    await page.goto(authUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('#login-username', { timeout: 60000 });
    await page.type('#login-username', process.env.SPOTIFY_USERNAME);
    await page.type('#login-password', process.env.SPOTIFY_PASSWORD);
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