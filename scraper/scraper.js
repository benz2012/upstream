const netflixScrape = require('./services/netflix.js')
const releaseURLs = require('./release_urls.json')

// Scrape data from all URLs
const scrapePromises = Object.keys(releaseURLs).map(service => {
  const url = releaseURLs[service]
  return new Promise(resolve => {
    switch (service) {
      case 'netflix':
        netflixScrape(url).then((releases) => {
          resolve(releases)
        })
        break
      default:
        resolve()
    }
  })
})

// Mangle data into worthwhile release objects and send those to the database
Promise.all(scrapePromises)
.then(resolutions => flatten(resolutions))
.then(releases => releases.filter(r => r))
.then(releases => {
  releases.forEach(r => {
    if (!r.valid()) {
      if (r.service) {
        console.log(r.service + " service scraper has failed to scrape a release")
      }
    }
  })
  return releases.filter(r => r.valid())
})
.then(releases => releases.filter(r => r.worthy()))
.then(releases => {
  console.log(releases)
  // send these to Firebase
})


// Utility Functions
const flatten = (arr) => arr.reduce(
  (acc, val) => acc.concat(
    Array.isArray(val) ? flatten(val) : val
  ),
  []
)
