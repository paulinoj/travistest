const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const customPage = new CustomPage(page, browser);

    return new Proxy(customPage, {
      get: function(target, property) {
        return target[property] || page[property] || browser[property];
      }
    });
  }

  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
  }

  close() {
    this.browser.close();
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);
  
    await this.page.setCookie({
      name: 'session',
      value: session
    });
  
    await this.page.setCookie({
      name: 'session.sig',
      value: sig
    });
  
    // Need to refresh this.page after setting cookies
    await this.page.goto('http://localhost:3000/blogs');
  
    // Wait for this.page to render so button is visible
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML);
  }

  // BIG GOTCHA WITH page.evaluate -- the argument is stringified and sent to 
  // chromium, therefore, any variables you put in there are sent as strings.
  // However, you can pass additional arguemnts to evaluate, which are are
  // passed as arguments to the function once it is converted back inside chromium.
  get(path) {
    return this.page.evaluate((_route) => {
      return fetch(_route, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
    }, path);
  };

  post(path, data) {
    return this.page.evaluate((_route, _data) => {
      return fetch(_route, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      }).then(res => res.json());
    }, path, data);
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data)
      })
    );
  }
}

module.exports = CustomPage;