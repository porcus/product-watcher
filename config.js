/*
<root> : {
    puppeteerOptions: ...
    recaptchaMatchConfigs: [ <matchConfig: matches content associated with a captcha>, ... ],
    notificationProviders: ...,
    productsToWatchByRetailer: [ <retailerConfig>, ... ]
}

matchConfig: {
    selector: <String: CSS selector to resolve element(s) against which the targetPattern will be matched>,
    targetPattern: <String: Regex pattern which will be tested for a match against the textContent of the result of the selector>
}

retailerConfig: {
    retailer: <String: name of retailer>,
    unavailableMatchConfigs: [ <matchConfig: identifies content that indicates the product is not available>, ... ],
    availableMatchConfigs: [ <matchConfig: matches content that indicates the product is available>, ... ],
    priceMatchConfigs: [ <(optional) matchConfig: matches content containing the product price>, ... ],
    navigationRetryMatchConfigs: [ <(optional) matchConfig: matches content that indicates that navigation to teh product url should be retried>, ... ],
    products: [ <productConfig>, ... ]
}

productConfig: {
    control: <(optional) Boolean: whether this definition should be treated as a "control" (i.e. a product which we expect to be available)>
    name: <String: display name of product>,
    url: <String: valid url to product page>,
    priceThreshold: <(optional) Number: If defined, a product must be available AND below this price in order to trigger an availability alert.  This requires a valid priceMatchConfig to be defined for the retailer.>
}
*/


const _ = require("lodash");
const defaults = require("./default.config.js");
const config = require("./ps5.config.js");
module.exports = _.merge({}, defaults, config);

