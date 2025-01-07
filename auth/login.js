import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { setAccessToken } from './tokenStore.js';

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
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(authUrl, { waitUntil: 'networkidle2' });

    // Wait for the login form to load and enter credentials
    await page.waitForSelector('#login-username', { timeout: 60000 });
    await page.type('#login-username', process.env.SPOTIFY_USERNAME);
    await page.type('#login-password', process.env.SPOTIFY_PASSWORD);
    await page.click('#login-button');

    console.log('logged in!');

    // Wait for the authorization page to load and click authorize
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Authorization page URL:', page.url());

    const url = page.url();
    const code = url.split('callback?code=')[1];
    console.log('CODE:', code);

    await browser.close();
    console.log('browser closed!');

    // // Exchange authorization code for access token
    // const tokenUrl = 'https://accounts.spotify.com/api/token';
    // const data = querystring.stringify({
    //   grant_type: 'authorization_code',
    //   code: code,
    //   redirect_uri: process.env.REDIRECT_URI,
    //   client_id: process.env.CLIENT_ID,
    //   client_secret: process.env.SECRET
    // });
    // const headers = {
    //   'Content-Type': 'application/x-www-form-urlencoded'
    // };

    // const response = await axios.post(tokenUrl, data, { headers });
    // const accessToken = response.data.access_token;
    // setAccessToken(accessToken);
    // console.log('Access token set:', accessToken);
  } catch (error) {
    console.error('Error during Spotify login:', error);
  }
}

export default login;