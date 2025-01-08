let accessToken = null;

export function setAccessToken(token) {
  console.log('NEW TOKEN!!!!!!!!!!!!!')
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}