const cheerio = require('cheerio')

const Release = require('../components/release.js')
const client_rendered_html = require('../get/client_html')

const serviceName = 'Netlfix'

function netflixScrape(url) {
  return new Promise((resolve, reject) => {
    client_rendered_html(url, (err, content) => {
      if (err) { reject(err) }

      const releases = []
      const dom = cheerio.load(content)
      const rows = dom('body').find('tbody').first().find('tr')

      rows.each((i, row) => {
        const name = dom(row).find('.oon-name').first()
          .find('span').first().text()
        const date = dom(row).find('.oon-date').first().text()
        const releaseType = dom(row).find('.oon-type').first().text()
        const release = new Release(name, date, serviceName, releaseType)
        releases.push(release)
      })

      resolve(releases)
    })
  })
}

module.exports = netflixScrape
