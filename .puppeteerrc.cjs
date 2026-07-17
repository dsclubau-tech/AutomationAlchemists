const {join} = require('path');
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer to a local folder
  // so Vercel can cache the Chrome binary across builds.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
