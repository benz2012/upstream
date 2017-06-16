class Release {
  constructor(name, date, service, releaseType) {
    this.name = name
    this.date = date
    this.service = service
    this.releaseType = releaseType
  }

  valid() {
    const attributes = Object.keys(this).map(key => this[key])
    return attributes.every(valid_attribute)
  }
  worthy() {
    // return false if release is not a tv show with an identifiable release date
    return true
  }
}

const valid_string = (val) => (typeof val === 'string' || val instanceof String)
const lengthy = (val) => (val.length > 0)
const valid_attribute = (val) => (valid_string(val) && lengthy(val))

module.exports = Release
