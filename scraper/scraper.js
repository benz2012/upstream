// Dependency Imports
const request = require('request')
const cheerio = require('cheerio')
const phantom = require('phantom')
// Local Imports
const Release = require('./release.js')
const releaseURLs = require('./release_urls.json')


// const allReleases = []
// scrape(releases => {
//   console.log(releases)
// })

Object.keys(releaseURLs).forEach(service => {
  const url = releaseURLs[service]
  switch (service) {
    case 'netflix':
      client_rendered_html(url, (content) => {
        const dom = cheerio.load(content)
        // console.log(dom('body').find('tbody').first().html())
        const rows = dom('body').find('tbody').first().find('tr')
        rows.each((i, row) => {
          const name = dom(row).find('.oon-name').first()
            .find('span').first().text()
          const date = dom(row).find('.oon-date').first().text()
          const releaseType = dom(row).find('.oon-type').first().text()
          const release = new Release(name, date, service, releaseType)
          // allReleases.push(release)
          console.log(release)
        })
      })
      break;
  }
})

function server_rendered_html(url) {
  request(url, (err, res, body) => {
    if (err) {
      console.log(err)
      throw "stop execution"
    }
    if (res) {
      console.log('Request returned with status code:', res.statusCode)
    }
    if (body) {
      console.log(body)
    } else {
      console.log('no html was receieved')
    }
  })
}

function client_rendered_html(url, callback) {
  let _ph, _page, _content;
  phantom.create().then(ph => {
    _ph = ph
    return _ph.createPage()
  }).then(page => {
    _page = page
    return _page.property('viewportSize', {width: 1920})
  }).then(() => {
    return _page.open(url)
  }).then(status => {
    console.log('Status: ' + status)
    return _page.property('content')
  }).then(content => {
    // console.log(content)
    _content = content
    return _page.close()
  }).then(() => {
    return _ph.exit()
  }).then(() => {
    callback(_content)
  })
  .catch(err => console.log(err))
}
