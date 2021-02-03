const puppeteer = (function(){
    if (true) {
        // puppeteer-extra is a drop-in replacement for puppeteer,
        // it augments the installed puppeteer with plugin functionality
        let puppeteer = require('puppeteer-extra');
        // add stealth plugin and use defaults (all evasion techniques)
        // For details:  https://www.npmjs.com/package/puppeteer-extra-plugin-stealth
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());
        return puppeteer;
    }
    else {
        return require('puppeteer');
    }
}());
const fs = require('fs');
const sleep = require('sleep-promise');
const got = require('got');  // docs:  https://github.com/sindresorhus/got
const retry = require('async-retry');
const globalconfig = require('./config.js');


// ===========================================================================================================================
// Get unstyled text content of selected elements on page.
async function getTextContent(page, selector) {
    return await page.evaluate(element => element.textContent, await page.$(selector) );
}

// ===========================================================================================================================
async function asyncEvaluateProductMatches(page, result) {

    result.availableMatchResult = await asyncEvaluateMatchesAndProduceAggregateMatchResult(page, result.config.availableMatchConfigs);
    result.unavailableMatchResult = await asyncEvaluateMatchesAndProduceAggregateMatchResult(page, result.config.unavailableMatchConfigs);

    // If product was found AND if price match configs were defined AND if a price threshold is configured for the product, then attempt to resolve the current price and compare it against the threshold.
    if (result.availableMatchResult.anyPatternMatches && !result.unavailableMatchResult.anyPatternMatches) {

        // If a price threshold has been set...
        if (result.config.priceThreshold) { // && result.config.priceMatchConfigs)
            result.priceMatchResult = await asyncEvaluateMatchesAndProduceAggregateMatchResult(page, result.config.priceMatchConfigs);
//console.debug('price match result:', result.priceMatchResult);
            // If price was found, then compare it to the threshold
            if (result.priceMatchResult.anyPatternMatches) {
                let firstPriceMatch = result.priceMatchResult.results.find(x => x.patternMatches).matchedText;
                let price = firstPriceMatch.replace('$','') * 1;
                result.actualPrice = price;
                result.notificationCriteriaSatisfied = price < result.config.priceThreshold;
                result.priceDifference = price - result.config.priceThreshold;
//console.info(`Price resolved for product using price match config.  [Pattern Extracted: ${firstPriceMatch}] [Numeric Price: ${price}] [Price Threshold: ${result.config.priceThreshold}] [Price < Threshold: ${result.priceDifference < 0}] [Price Difference: ${result.priceDifference}]`);
            } else {
                result.notificationCriteriaSatisfied = false;
            }
        } else {
            result.notificationCriteriaSatisfied = true;
        }
    }
}

// ===========================================================================================================================
async function asyncEvaluateMatchesAndProduceAggregateMatchResult(page, matchConfigs) {

    let aggregateMatchResult = { anyPatternMatches: false, results: [] };
    
    for (const mc of matchConfigs) {
        const ar = await checkForPattern(page, mc);
        aggregateMatchResult.results.push(ar);
        aggregateMatchResult.anyPatternMatches = aggregateMatchResult.anyPatternMatches || ar.patternMatches;
    }

    return aggregateMatchResult;
}

// ===========================================================================================================================
async function asyncEvaluatePageRefreshMatchConfigs(page, result) {
    // Conditionally evaluate match configs (which may signal a need to reload the page)
    if (result.config.navigationRetryMatchConfigs && result.config.navigationRetryMatchConfigs.length > 0) {
        result.navigationRetryMatchResult = await asyncEvaluateMatchesAndProduceAggregateMatchResult(page, result.config.navigationRetryMatchConfigs);
        result.pageRefreshNeeded = result.navigationRetryMatchResult.anyPatternMatches;
    } else {
        result.pageRefreshNeeded = false;
    }
    return !result.pageRefreshNeeded;
}

// ===========================================================================================================================
async function asyncLoadProductPage(page, result) {
    result.pageLoadedSuccessfully = false;  // (Boolean) whether the page loaded with a 200 status, didn't redirect, and is ready for querying
    result.pageRefreshNeeded = null;
    result.sessionHasClosed = false;
    result.browserHasDisconnected = false;
    result.networkInternetDisconnected = false;
    result.networkNameNotResolved = false;
    result.responseStatus = null;  // (int) HTTP status code
    result.redirectedTo = null;  // (string) url of page after navigation (if different)
    result.waitForSelectorIsValid = null;  // (Boolean) whether the result of waitForSelector (if specified) was resolved successfully
    result.timings.pageRequested = new Date(); 

    // Navigate to product page
    const initialNavigationResult = await Promise.all([
        page.waitForNavigation({timeout: 0}),
        page.goto(result.config.url, {timeout: 15000, waitUntil: 'domcontentloaded' })
    ])
    .then(async responses => {
        if (responses) {
            if (!responses[0]) {
                result.responseStatus = null;
                console.warn('>>> Responses:', responses);
            }
            else {
                let response = responses[0];
                result.responseStatus = response.status();
            }
            result.timings.pageLoaded = new Date(); 

            // Check page url after navigation in order to detect navigation redirection
            const pageUrlAfterNavigation = await page.url();
            if (!pageUrlAfterNavigation.includes(result.config.url)) {
                result.redirectedTo = pageUrlAfterNavigation;
                // console.warn(`  After page navigation, url appears to have changed, presumably due to a redirection.  [Retailer: "${result.config.retailer}"]  [Product: "${result.config.name}"]  [Original URL: "${result.config.url}"]  [ResponseStatusCode: ${result.responseStatus}]  [Current URL: "${pageUrlAfterNavigation}"]`, '\u0007');
            }
            return true;
        } else console.warn(`>>> Product page navigation resolved an empty result`);
    }, reject => {
        const rejectionMessage = reject.toString();
        result.pageRefreshNeeded = rejectionMessage.includes('TimeoutError: Navigation timeout');
        result.sessionHasClosed = rejectionMessage.includes('Session closed.');
        result.browserHasDisconnected = rejectionMessage.includes('Navigation failed because browser has disconnected!');
        result.networkInternetDisconnected = rejectionMessage.includes('Error: net::ERR_INTERNET_DISCONNECTED');
        result.networkNameNotResolved = rejectionMessage.includes('Error: net::ERR_NAME_NOT_RESOLVED');
        if (!(result.pageRefreshNeeded || result.sessionHasClosed || result.browserHasDisconnected || result.networkInternetDisconnected || result.networkNameNotResolved))
            console.warn(`>>> Product page navigation to ${result.config.url} failed for a reason that has not yet been accounted for.  [${reject}]`);
        return false;
    })
    .catch(err => {
        console.error(`Navigation to product page resulted in an unanticipated error.`, err);
    });

    if(!initialNavigationResult) return;


    // Sleep (in order to avoid making too many repetitive requests to the same host)
    //await sleep(2000);


    // Evaluate page refresh match configs (which may signal a need to reload the page) and bail out if any patterns match.
    if (! await asyncEvaluatePageRefreshMatchConfigs(page, result)) return;


    // Conditionally wait for the product page's waitForSelector (if specified)
    if (result.config.waitForSelector) {
        result.waitForSelectorIsValid = await page.waitForSelector(result.config.waitForSelector, {timeout: 10000})
            .then(waitForSelectorResult => {
                if (!waitForSelectorResult) console.warn(`>>> waitForSelector resolved an empty result`);
                return !!waitForSelectorResult;
            }, rejection => {
                //console.warn(`>>> Resolution of the product page waitForSelector failed.  Did it just time out?  ${rejection}`);
                result.timeoutExceededWaitingForSelector = rejection.toString().includes('TimeoutError: '); // not ideal; i could probably test the constructor type instead
                return false;
            });
    } else {
        result.waitForSelectorIsValid = true;
    }


    // Evaluate page refresh match configs (which may signal a need to reload the page) and bail out if any patterns match.
    if (! await asyncEvaluatePageRefreshMatchConfigs(page, result)) return;


    // Update page load status
    result.pageLoadedSuccessfully = initialNavigationResult 
        && result.responseStatus == 200 && !result.redirectedTo 
        && !result.pageRefreshNeeded && result.waitForSelectorIsValid;
}

// ===========================================================================================================================
async function asyncCheckProductAvailability(page, productConfig) {
    let timings = {
        pageRequested: null,
        pageLoaded: null,
        checkEnded: null,
        totalCheckDurationInMs: null,
        testMatchDurationInMs: null,
        pageLoadDurationInMs: null
    };
    let result = {
        config: productConfig,
        timings: timings
    };

    // Perform navigation to product page, retrying only while a page refresh is needed or if the waitforselector wasn't found (i.e. result.pageRefreshNeeded == true || result.waitForSelectorIsValid == false)
    await retry(async bail => {
        await asyncLoadProductPage(page, result);
        const bailOut = !result.pageRefreshNeeded && result.waitForSelectorIsValid;
        return bailOut;
    }, {
        retries: 3
    });


    // If page navigation completed successfully, then attempt to confirm matches for target product availability
    if (result.pageLoadedSuccessfully) {
        await asyncEvaluateProductMatches(page, result);

//console.log('dumping result:', result);
        // If neither pattern matched, then we may have attempted to match a bit too early (i.e. before dynamic content had finished loading), so let's retry once more
        let retryCount = 3;
        result.waitForSelectorIsValid
        while (retryCount > 0 && !result.availableMatchResult.anyPatternMatches && !result.unavailableMatchResult.anyPatternMatches) {
            console.log(`  Neither pattern matched content on product page.  Retrying again soon...  [Retailer: "${productConfig.retailer}"]  [Product: "${productConfig.name}"]  [RemainingRetries: ${retryCount}]`)
            await sleep(1000);
            await asyncEvaluateProductMatches(page, result);
            retryCount--;
        }
    }


    timings.checkEnded = new Date();
    timings.totalCheckDurationInMs = timings.checkEnded - timings.pageRequested;
    timings.pageLoadDurationInMs = timings.pageLoaded - timings.pageRequested;
    timings.testMatchDurationInMs = timings.checkEnded - timings.pageLoaded;
    return result;
}


// ===========================================================================================================================
async function checkForPattern(page, matchPatternConfig) {
    let result = {
        config: matchPatternConfig,
        timeoutExceededWaitingForSelector: true,
        selectorIsValid: false,
        selectedText: null,
        patternMatches: false,
        matchedText: null
    };

    // Resolve element using selector.
    result.selectorIsValid = await page.$(matchPatternConfig.selector).then(resolve => !!resolve, reject => false);
    if (!result.selectorIsValid)
        return result;

    result.selectedText = await getTextContent(page, matchPatternConfig.selector);

    // Treat the target pattern as a [case insensitive] regular expression.  If it matches the textContent of the elements selected by the selector, then we have a match!
    let match = new RegExp(matchPatternConfig.targetPattern, "i").exec(result.selectedText);
//console.info('regex match result: ', match);
    if (result.patternMatches = !!match) {
        result.matchedText = match[1];
    }
    return result;
}

// ===========================================================================================================================
function getCurrentDateTimeString() {
    return new Date().toISOString().replace('T', ' ').replace('Z','');
}

// ===========================================================================================================================
function logToAvailableItemsFile(msg) {
    fs.appendFile('available-items.txt', `${getCurrentDateTimeString()} | ${msg}\n`, function(err) {
        if (err) throw err;
    });
}

// ===========================================================================================================================
async function asyncLogAndAlertOnProductAvailability(notificationProvidersConfig, productConfig) {
    logToAvailableItemsFile(`Product is now AVAILABLE!!  [Retailer: "${productConfig.retailer}"]  [Product: "${productConfig.name}"]  [URL: "${productConfig.url}"]`);
    await asyncSendPushNotificationForProductAvailability(notificationProvidersConfig, productConfig)
}

// ===========================================================================================================================
async function asyncSendPushNotificationForProductAvailability(notificationProvidersConfig, productConfig) {
    await asyncSendPushNotification(notificationProvidersConfig, 'Watched product is available!', `[Retailer: "${productConfig.retailer}"]\n[Product: "${productConfig.name}"]\n[URL: "${productConfig.url}"]`, productConfig.url);
}

// ===========================================================================================================================
async function asyncSendPushNotification(notificationProvidersConfig, title, body, /* optional*/ url) {
    if (!notificationProvidersConfig || notificationProvidersConfig.constructor !== Array)
    {
        console.info(`No notification provider configuration has been specified.  If you want push notifications to be sent, add them to the configuration file.`);
        return;
    }

    // PushBullet API docs:  https://docs.pushbullet.com/#pushbullet-api
    // Get an access token from your PushBullet account settings page:  https://www.pushbullet.com/#settings/account
    const pushbulletConfig = notificationProvidersConfig.find(x => x.name && x.name.toLowerCase() == 'pushbullet');
    if (pushbulletConfig) {
        if (!pushbulletConfig.apiAccessToken)
            console.info(`The PushBullet API access token was not provided, so this push notification provider will not be used. See config file for details on how to use this.`);
        else {
            await got.post('https://api.pushbullet.com/v2/pushes',
            {
                json: { 
                    type : !url ? 'note' : 'link', 
                    title : title,
                    body : body,
                    url: !url ? undefined : url
                },
                responseType: 'json',
                headers: {
                    'user-agent': undefined,
                    'Access-Token': pushbulletConfig.apiAccessToken, //'o.c0VyUzLrlBRj89oFCKq0kqwKnBXqayGY',
                    'Content-Type': 'application/json'
                }
            })
            .then(r => {
                console.info(`A push notification should have been successfully sent via PushBullet.  Abbreviated Response:`, {
                    //statusCode: r.statusCode,
                    //statusMessage: r.statusMessage,
                    //retryCount: r.retryCount,
                    //headers: r.headers,
                    //timings: r.timings,
                    body: r.body
                }, '\u0007');
            })
            .catch(error => {
                console.warn("Error produced while sending push notification.", /*error?.response?.body ??*/ error);
            });
        }
    }
    else
        console.log('pushbulletConfig is not valid');
}

// ===========================================================================================================================
async function asyncSaveScreenshotAndSourceOfProductPage(page, productMatchResult, label) {
    const filenameRegex = /[^A-Za-z0-9\._]{1}/gi;
    const baseFilename = `${getCurrentDateTimeString()}--${productMatchResult.config.retailer}--${productMatchResult.config.name}--${label}`.replace(filenameRegex, '-');

    const screenshotFilename = `${baseFilename}--screenshot.png`;
    await page.screenshot({ path: screenshotFilename });

    const contentFilename = `${baseFilename}--content.html`;
    const content = await page.content();
    fs.writeFile(contentFilename, content, function(err) {
        if (err) throw err;
    });

    const resultFilename = `${baseFilename}--result.html`;
    fs.writeFile(resultFilename, JSON.stringify(productMatchResult, null, 4), function(err) {
        if (err) throw err;
    });
}

// ===========================================================================================================================
async function captureScreenShotForRetailerAndProduct(page, productConfig, label) {
    const filenameRegex = /[^A-Za-z0-9\._]{1}/gi;
    let filename = `${getCurrentDateTimeString()}--${productConfig.retailer}--${productConfig.name}--${label}.png`
        .replace(filenameRegex, '-');
    await page.screenshot({ path: filename });
}




const globals = {
    options: null,
    config: globalconfig,
    productsToWatch: [],
    browser: null,
    internetIsConnected: true,
    hostNameResolutionIsWorking: true,
    pageIsOpen: true,
    summaryStats: {
        attemptedChecks: 0, 
        successfulChecks: 0,
    }
};

// ==============================================================================
// Main entry point
(async () => {

    processCommandLineArgumentsAndResolveOptions();

    validateFilterSortProducts();
    if (globals.productsToWatch.length === 0)
        return;

    // Launch browser 
    // see https://stackoverflow.com/questions/59482893/puppeteer-with-brave-browser/59484822#59484822
    const puppeteerOptions = {
        headless: globals.options.headless !== undefined ? globals.options.headless : !!globals.config.puppeteerOptions.headless,
        defaultViewport: null,  // account for an ugly visual glitch where the viewport doesn’t fill the window
        //userDataDir: "C:\\Users\\Paul\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data\\Default\\"  //"path/to/profile/dir"
    };
    // Note: since optional chaining doesn't work in this version of node, I have to use the following instead of this:  executablePath: globals.config.puppeteerOptions?.executablePath ?? undefined,
    if (globals.config.puppeteerOptions && globals.config.puppeteerOptions.executablePath) {
        puppeteerOptions.executablePath = globals.config.puppeteerOptions.executablePath;
    }
    // Note: since optional chaining doesn't work in this version of node, I have to use the following instead of this:  userDataDir: globals.config.puppeteerOptions?.userDataDir ?? undefined,
    if (globals.config.puppeteerOptions && globals.config.puppeteerOptions.userDataDir) {
        puppeteerOptions.userDataDir = globals.config.puppeteerOptions.userDataDir;
    }
    console.log("puppeteerOptions: ", puppeteerOptions);
    globals.browser = await puppeteer.launch(puppeteerOptions);

    const page = await globals.browser.newPage();

    // Randomize viewport size
    await page.setViewport({
        width: 1000 + Math.floor(Math.random() * 20),
        height: 700 + Math.floor(Math.random() * 20),
        deviceScaleFactor: 2,
        hasTouch: false,
        isLandscape: false,
        isMobile: false,
    });


    // Register page close handler
    page.on('close', () => {
        console.info('Page has been closed', '\u0007');
        globals.pageIsOpen = false;
    });

    // Skip images/styles/fonts loading for performance
    if (globals.options.omitVisuals) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    // block bad scripts:  moatads.js, doubleclick
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        let url = req.url();
        let type = req.resourceType();
        if ((type == 'script' && url.includes('moatads')) || url.includes('doubleclick')) {
            //console.info(' > aborting resource: ', url);
            req.abort();
        } else {
            req.continue();
        }
    });


    // Main loop
    while (globals.pageIsOpen) {

        await asyncCheckNetworkConditionsAndAwaitResolution(page);

        // Bypass products whose ignore flag has since been set
        let remainingProductsToWatch = globals.productsToWatch.filter(x => !x.ignore);
        if (remainingProductsToWatch.length === 0)
            return;

        // Iterate over products to watch
        for (const pc of remainingProductsToWatch) {

            if (!globals.pageIsOpen) continue;
            if (!globals.internetIsConnected) continue;

            // // in case product's ignore flag was set after page was visited...
            // if (pc.ignore) continue;

            // Account for skip check counter
            if (pc.skipCheckCounter) {
                pc.skipCheckCounter--;
                continue;
            }

            // Check for availability of current product
            globals.summaryStats.attemptedChecks++;
            let result = await asyncCheckProductAvailability(page, pc);

            // Handle session close
            if (result.sessionHasClosed) {
                console.info(`It's been detected that the session has closed.  Exiting...`, '\u0007');
                globals.pageIsOpen = false;
                continue;
            }

            // Handle browser disconnection
            if (result.browserHasDisconnected) {
                console.info(`It's been detected that the browser has disconnected.  Exiting...`, '\u0007');
                globals.pageIsOpen = false;
                continue;
            }

            // Handle internet disconnection
            if (result.networkInternetDisconnected) {
                console.info(`It's been detected that the internet is disconnected.  Awaiting reconnection...`, '\u0007');
                globals.internetIsConnected = false;
                continue;
            }

            // Handle DNS resolution failure
            if (result.networkNameNotResolved) {
                console.info(`It's been detected that name resolution has stopped working.  Awaiting resolution...`, '\u0007');
                globals.hostNameResolutionIsWorking = false;
                continue;
            }


            // Attempt to detect a Recaptcha
            result.recaptchaMatchResult = await asyncEvaluateMatchesAndProduceAggregateMatchResult(page, globals.config.recaptchaMatchConfigs);
            result.hasRecaptcha = !!result.recaptchaMatchResult.anyPatternMatches;


            if (!globals.pageIsOpen) return;

            let timingsString = `${getCurrentDateTimeString()} | [${(result.timings.totalCheckDurationInMs+'').padStart(6,' ')} ms (${(result.timings.pageLoadDurationInMs+'').padStart(5,' ')} + ${(result.timings.testMatchDurationInMs+'').padStart(5,' ')})]`;

            if (result.pageLoadedSuccessfully) {
                globals.summaryStats.successfulChecks++;

// TODO: simplify conditions here...
                if (result.availableMatchResult.anyPatternMatches == result.unavailableMatchResult.anyPatternMatches) {
                    if (!result.availableMatchResult.anyPatternMatches) {
                        // If neither pattern matches
                        console.warn(`${timingsString} Neither available nor unavailable pattern matched content on product page.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                        await asyncSaveScreenshotAndSourceOfProductPage(page, result, 'neither-pattern-matched');
                    } else {
                        // If both patterns match
                        console.warn(`${timingsString} Both available and unavailable patterns match content on product page.  Please investigate the selectors and target patterns.\n`, result, '\u0007');
                        //console.warn(`${timingsString} At retailer "${pc.retailer}", availability of product "${pc.name}" is uncertain/ambiguous. Both results are ${result.availableMatchResult.anyPatternMatches}, possibly due to a configuration issue.  Please investigate the selectors and target patterns.\n`, result);
                        await asyncSaveScreenshotAndSourceOfProductPage(page, result, 'both-patterns-match');
                    }
                    //await captureScreenShotForRetailerAndProduct(page, pc, 'uncertain-availability');
                } else if (result.availableMatchResult.anyPatternMatches) {
                    // Product is available.  But were all notification criteria satisfied?
                    if (result.notificationCriteriaSatisfied) {
                        if (result.config.control) {
                            // If the available pattern matches the control product, then do not log anything, as this is what we would typically expect.
                            //console.info(`\n${timingsString} As expected, the control product for retailer ${pc.retailer} was available.`);
                        } else {
                            // If a non-control product is available, log messages to console and file and send a notification.
                            console.info(`${timingsString} Product is AVAILABLE!!  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                            await asyncLogAndAlertOnProductAvailability(globals.config.notificationProviders, pc);
                            await asyncSaveScreenshotAndSourceOfProductPage(page, result, 'product-is-available');
                            pc.skipCheckCounter = 1000;
                            console.info(`${timingsString} No more product availability checks will be performed for it for the next ${pc.skipCheckCounter} cycles.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                        }
                    } else {
                        if (result.config.control) {
                            //console.info(`${timingsString} Notification criteria not satisfied for an available control product.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]  [PriceThreshold: $${pc.priceThreshold}]  [Price: $${result.actualPrice}]`, '\u0007');
                        } else {
                            //console.info(`${timingsString} Notification criteria not satisfied for an available non-control product.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]  [PriceThreshold: $${pc.priceThreshold}]  [Price: $${result.actualPrice}]`, '\u0007');
                        }
                    }
                } else if (result.unavailableMatchResult.anyPatternMatches) {
                    if (result.config.control) {
                        // If the unavailable pattern matches the control product, then we should investigate this.
                        console.warn(`${timingsString} Control product appears to be unavailable.  This should be investigated.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]`, '\u0007');
                        await asyncSaveScreenshotAndSourceOfProductPage(page, result, 'control-product-unavailable');
                    } else {
                        // If the unavailable pattern matches a non-control product, then do not log anything, as this is a typical outcome.
                        //console.info(`${timingsString} Product still unavailable.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]`);
                    }
                }
            } else {
                // Handle Recaptcha outcomes before other outcomes 
                if (result.hasRecaptcha) {
                    pc.ignore = true;  // ignore this product for the rest of this session
                    console.warn(`${timingsString} Product page failed to load successfully due to a recaptcha.  Content could not be analyzed.  `+
                        `Since the Recaptcha can likely only be bypassed by using a session where the challenge has been completed, it may be necessary to load a user session for this retailer/product.  `+
                        `This product will be ignored for the remainder of this session.  `+
                        `[Status: ${result.responseStatus}]  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                    await asyncSaveScreenshotAndSourceOfProductPage(page, result, `page-load-failed-with-recaptcha`);
                } 
                // Handle redirections
                else if (result.redirectedTo) {
                    // If a redirection has occurred, then bring attention to this fact
                    pc.ignore = true;  // ignore this product for the rest of this session
                    console.warn(`${timingsString} A redirection appears to have occurred when navigating to the product page.  `+
                        `This should be investigated.  This product will be ignored for the remainder of this session.  `+
                        `[Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [Original URL: "${pc.url}"]  [ResponseStatusCode: ${result.responseStatus}]  [Current URL: "${result.redirectedTo}"]`, '\u0007');
                    await asyncSaveScreenshotAndSourceOfProductPage(page, result, 'redirection-occurred');
                } 
                // Handle unexpected response statuses
                else if (result.responseStatus != 200) {
                    // If page is not found or gone, then indicate this fact and move on
                    if (result.responseStatus == 403 || result.responseStatus == 404 || result.responseStatus == 410) {
                        // pc.skipCheckCounter = 10;
                        // console.warn(`${timingsString} Product page failed to load successfully.  Content could not be analyzed.  Bypassing checks for the next ${pc.skipCheckCounter} iterations.  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]  [Status: ${result.responseStatus}]`, '\u0007');
                        pc.ignore = true;  // ignore this product for the rest of this session
                        console.warn(`${timingsString} Product page failed to load successfully with a 4XX status code.  Content could not be analyzed.  This product will be ignored for the remainder of this session.  [Status: ${result.responseStatus}]  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                    } else {
                        console.warn(`${timingsString} Product page navigation completed with a status code other than 200.  [Status: ${result.responseStatus}]  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                    }
                    await asyncSaveScreenshotAndSourceOfProductPage(page, result, `page-load-failed-with-status-${result.responseStatus}`);
                } else {
                    console.warn(`${timingsString} Product page navigation failed for an unhandled reason.  [Status: ${result.responseStatus}]  [Retailer: "${pc.retailer}"]  [Product: "${pc.name}"]  [URL: "${pc.url}"]`, '\u0007');
                    await asyncSaveScreenshotAndSourceOfProductPage(page, result, `unhandled-page-load-failure`);
                }
            }
        }
    }

    if (globals.options.headless) {
        await globals.browser.close();
    }

 })()
.catch(err => {
    console.error('\nUnhandled error (catch-all): ', err);
})
.finally(() => {
    // Display summary 
    console.info(`${globals.productsToWatch.length} products watched at the end.  Summary stats: `, globals.summaryStats);
    console.info('End of automation script.');
});


/////////////////////////////////////////////////////////////////////////////


function processCommandLineArgumentsAndResolveOptions() {
    console.log(`
    Optional command-line arguments:\n
        --headless : runs Chrome in headless mode (no visible window)
        --omit-visuals : cancels loading of images and stylesheets (should decrease loading time)
        --include-control-products : also check products having 'control:true' in a config file
        --filter "regex matching retailer name or product name" : only consider products whose retailer name or product name/description matches the provided regex
    `);

    globals.options = {
        headless: process.argv.includes('--headless'),
        omitVisuals: process.argv.includes('--omit-visuals'),
        includeControlProducts: process.argv.includes('--include-control-products'),
    };

    //console.log(`${process.argv}`);
    const indexOfProductFilter = process.argv.indexOf('--filter');
    if (indexOfProductFilter > 0 && indexOfProductFilter + 1 <= process.argv.length) {
        globals.options.filter = process.argv[indexOfProductFilter + 1];
    }

    console.log(`${getCurrentDateTimeString()} | Effective Options: \n`, globals.options, '\n');
}



function validateFilterSortProducts() {
    // validate and filter products and merge properties based on configuration 
    const retailerProductNameFilter = globals.options.filter ? new RegExp(globals.options.filter, "i") : null;
    const filteredRetailerConfigs = [];
    for (const retailerConfig of globals.config.productsToWatchByRetailer) {
        if (retailerConfig.ignore) {
            console.warn(`- Retailer has been marked with ignore:true, so none of its products will be watched.  `+
                `[Retailer: "${retailerConfig.retailer}"]  [Number of Products: ${retailerConfig.products.length}]`);
            continue;
        }

        let retailerDefaults = {
            retailer: retailerConfig.retailer,
            waitForSelector: retailerConfig.waitForSelector,
            availableMatchConfigs: retailerConfig.availableMatchConfigs,
            unavailableMatchConfigs: retailerConfig.unavailableMatchConfigs,
            priceMatchConfigs: retailerConfig.priceMatchConfigs,
        };

        let filteredProductConfigs = [];
        for (const productConfig of retailerConfig.products) {

            // Create a merged representation of the product config which uses properties from the retailer config for defaults
            const mpc = mergedProductConfig = Object.assign({}, retailerDefaults, productConfig);

            // Perform validation prior to adding it.  Log a message for any product deemed invalid for watching.
            if (mpc.priceThreshold && !mpc.priceMatchConfigs) {
                console.warn('- A price threshold has been set for a product, but no priceMatchConfigs have been defined for it.  Product will not be watched until this is corrected.  '+
                    `[Retailer: "${mpc.retailer}"]  [Product: "${mpc.name}"]  [URL: "${mpc.url}"]  [Price: $${mpc.priceThreshold}]`);
            } else if (mpc.control && !globals.options.includeControlProducts) {
                console.info('- Control product will be excluded.  '+
                    `[Retailer: "${mpc.retailer}"]  [Product: "${mpc.name}"]  [URL: "${mpc.url}"]`);
            } else if (mpc.ignore) {
                console.info('- Product has been marked with "ignore:true", so it will not be watched.  '+
                    `[Retailer: "${mpc.retailer}"]  [Product: "${mpc.name}"]  [URL: "${mpc.url}"]`);
            } else if (retailerProductNameFilter && !retailerProductNameFilter.test(mpc.retailer + ' ' + mpc.name)) {
                console.info(`- Filter was specified, but neither the retailer name nor the product name matched the filter, so it will not be watched.  `+
                    `[Retailer: "${mpc.retailer}"]  [Product: "${mpc.name}"]  [URL: "${mpc.url}"]`);
            } else
                filteredProductConfigs.push(mpc);
        }

        if (filteredProductConfigs.length) {
            let copyOfRetailerConfig = Object.assign({}, retailerConfig, { products: filteredProductConfigs});
            filteredRetailerConfigs.push(copyOfRetailerConfig);

            // Assign an ordinal to each remaining product under this retailer
            let itemPct = 100 / filteredProductConfigs.length;
            filteredProductConfigs.forEach((item, i) => {
                // Assign ordinal to each product.  Multiply using (i+1) for last item @ 100% or (i) for first item at 0%.
                item.ordinal = (i+1) * itemPct;
            });
        }
    }

    // flatten products into new array
    for (const retailerConfig of filteredRetailerConfigs) {
        for (const productConfig of retailerConfig.products) {
            globals.productsToWatch.push(productConfig);
        }
    }

    // Summary message of products to watch before main loop
    console.info(`After filtering, ${globals.productsToWatch.length} products from ${filteredRetailerConfigs.length} retailers remain to be watched.`);

    // Sort items by relative product ordinal
    globals.productsToWatch.sort((a,b) => a.ordinal - b.ordinal);
}


async function asyncCheckNetworkConditionsAndAwaitResolution(page) {

    // If internet is not connected, periodically check for reconnection to the internet
    while (globals.pageIsOpen && (!globals.internetIsConnected || !globals.hostNameResolutionIsWorking)) {

        await sleep(3000);

        const testResult = {
            config: {
                name: "Google main page (internet connectivity test)",
                url: "https://www.google.com"
            },
            timings: {}
        };
        await asyncLoadProductPage(page, testResult);

        // Handle session close
        if (testResult.sessionHasClosed) {
            console.info(`It's been detected that the session has closed.  Exiting...`, '\u0007');
            globals.pageIsOpen = false;
            continue;
        }

        // Handle browser disconnection
        if (testResult.browserHasDisconnected) {
            console.info(`It's been detected that the browser has disconnected.  Exiting...`, '\u0007');
            globals.pageIsOpen = false;
            continue;
        }
        
        // Transition from disconnected to connected internet
        if (!globals.internetIsConnected && !testResult.networkInternetDisconnected && testResult.pageLoadedSuccessfully) {
            globals.internetIsConnected = true;
            console.info("The internet connection seems to have been restored.");
        }
        //globals.internetIsConnected = !testResult.networkInternetDisconnected && !testResult.networkNameNotResolved && testResult.pageLoadedSuccessfully;

        // Transition from failed to successful host name resolution
        if (!globals.hostNameResolutionIsWorking && !testResult.networkNameNotResolved && testResult.pageLoadedSuccessfully) {
            globals.hostNameResolutionIsWorking = true;
            console.info("Name resolution seems to have been restored.");
        }
    }

    
}