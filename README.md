# Upcoming Shows

Little web scraper to go through upcoming shows at a few venues I like to check out. I found the artists listed were mostly ones I was unfamiliar with, but I knew they had good taste. I figured a better route would be to create a way to automate playlist creation and updates. The sensitive info 

## Getting Started

If you want to be adding playlists to your own account you're gonna need to set up an account over at [spotify for developers](https://developer.spotify.com). Then set up the necessary credentials inside a .env file

I set it up with the redirect on spotify for developers as 'localhost:{PORT}/callback' when registering the app. If you need to find your user id you can find it in the sample on [this page](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile)

### Installing

This is a node app using puppeteer. You will need to make sure you have node installed. To install all modules in the root directory use 
'npm i'

to get the server up and running use the command

'npm start'

to create the playlists based on the found artists from the scraper use send an empty get call to:
localhost:{port}/run-monthly-venue
