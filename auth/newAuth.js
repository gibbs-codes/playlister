const axios = require("axios");
const querystring = require('querystring');

module.exports.handler = (event, context, callback) => {
    const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic XXX'
          }
    axios.post('https://accounts.spotify.com/api/token?grant_type=client_credentials', querystring.stringify({}), {
      headers: headers
    })
    .then(function(response) {
        const res = {
        statusCode: 200,
        body: (response.data.access_token)
    };
        callback(null, res);
    })
    .catch(function(err) {
       console.error("Error: " + err);
       callback(err);
    });
};