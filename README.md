# Node Putcast

## What it is?

This project provides an RSS feed that lists all files for any put.io account. Originally when this project was first built there was no RSS feed available for put.io so I was using this as a mechanism to automate downloads into my Synology NAS.

Now however, RSS feeds are available within put.io directly. Which has invalidated the need for this to exist though I will leave the code here for posterity's sake. To generate an RSS feed simply...

* Navigate to the folder you wish to convert to an RSS feed
* Actions > RSS Feed
* Select a feed type
* Copy the url and use as desired.

If you're using this feed on a device that cannot perform the signin i.e. a NAS, you can edit the url to include your username and password e.g. `https://USERNAME:PASSWORD@put.io/rss/all/0`
