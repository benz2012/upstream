const netflixScrape = require('./services/netflix.js')
const releaseURLs = require('./release_urls.json')

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

Promise.all(scrapePromises).then(resolutions => {
  const allReleases = []
  resolutions.forEach(resolution => {
    if (resolution) {
      resolution.forEach(release => {
        allReleases.push(release)
      })
    }
  })
  return allReleases
}).then(releases => {
  console.log(releases)
})
