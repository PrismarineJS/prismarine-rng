function configForVersion (json, mcData) {
  if (json.default !== undefined) {
    let value = json.default
    for (const version of Object.keys(json).filter(x => x !== 'default')) {
      if (mcData.isNewerOrEqualTo(version)) value = json[version]
    }
    return value
  }
  if (typeof json === 'object') {
    for (const key of Object.keys(json)) {
      json[key] = configForVersion(json[key], mcData)
    }
  }
  return json
}

module.exports = (mcData) => {
  let regional = require('./regional.json')
  regional = configForVersion(regional, mcData)
  return regional
}
