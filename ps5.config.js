module.exports = {
    productsToWatchByRetailer:
    [
        {
            retailer: "Amazon",
            availableMatchConfigs: [
                {
                    selector: "#add-to-cart-button[value='Add to Cart']",
                    targetPattern: ""
                },
                {
                    selector: "#pantryBuyBoxJoinPrime-announce",
                    targetPattern: "Try Prime"
                }
            ],
            unavailableMatchConfigs: [
                {
                    selector: "#outOfStock",
                    targetPattern: "Currently [Uu]navailable"
                },
                {
                    selector: "#buybox-see-all-buying-choices-announce",
                    targetPattern: "See All Buying Options"
                }
            ],
            products: [
                {
                    control: true,
                    name: "PS5: Marvel's Spider-Man: Miles Morales Ultimate Launch Edition",
                    url: "https://www.amazon.com/Marvels-Spider-Man-Morales-Ultimate-Launch-PlayStation/dp/B08FC66ZV4/"
                },
                {
                    name: "PlayStation 5 Console",
                    url: "https://www.amazon.com/PlayStation-5-Console/dp/B08FC5L3RG"
                },
                {
                    name: "Playstation 5 Digital Edition",
                    url: "https://www.amazon.com/PlayStation-5-Digital/dp/B08FC6MR62"
                }
            ]
        },

        {
            // NOTE:  if IP blocked again, try a DHCP release and renew on the router",
            ignore: false,
            retailer: "GameStop",
            availableMatchConfigs: [{
                selector: "#primary-details > div.primary-details-row > div.cart-and-ipay.divider-line.no-border-mobile > div.add-to-cart-buttons.tulsa-atcbutton-toggle > div > div:nth-child(1) > button",
                targetPattern: "Add to Cart"
            }],
            unavailableMatchConfigs: [{
                selector: "#primary-details > div.primary-details-row > div.cart-and-ipay.divider-line.no-border-mobile > div.add-to-cart-buttons.tulsa-atcbutton-toggle > div > div:nth-child(1) > button",
                targetPattern: "Not Available"
            }],
            products: [
                {
                    control: true,
                    name: "Super Smash Bros. Ultimate",
                    url: "https://www.gamestop.com/video-games/switch/games/products/super-smash-bros.-ultimate/10159620.html?condition=New"
                },
                {
                    ignore: false,
                    // NOTE:  highly problematic (i.e.  Access Denied when adding to cart every time)",
                    name: "Playstation 5 (OLD)",
                    url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5/11108140.html?condition=New"
                },
                {
                    ignore: false,
                    // NOTE:  highly problematic (i.e.  Access Denied when adding to cart every time)",
                    name: "Playstation 5 Digital Edition (OLD)",
                    url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-digital-edition/11108141.html?condition=New"
                },

                // {
                //     ignore: true,
                //     // NOTE:  HTTP status 410: Gone",
                //     name: "PlayStation 5 Exclusive Titles System Bundle",
                //     url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-exclusive-titles-system-bundle/B225169H.html"
                // },
                // {
                //     ignore: true,
                //     // NOTE:  HTTP status 410: Gone",
                //     name: "PlayStation 5 Digital Edition Accessories and System Bundle",
                //     url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-digital-edition-accessories-and-system-bundle/B225171F.html"
                // },
                // {
                //     ignore: true,
                //     // NOTE:  HTTP status 410: Gone",
                //     name: "PlayStation 5 Spider-Man Demon's Souls and Accessories System Bundle",
                //     url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-spider-man-demons-souls-and-accessories-system-bundle/B225169G.html"
                // },

                // {
                //     ignore: true,
                //     // NOTE:  OOS permanently?",
                //     name: "PlayStation 5 Ultimate Gamer System Bundle",
                //     url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-ultimate-gamer-system-bundle/B225169I.html?condition=New"
                // },
                // {
                //     ignore: true,
                //     // NOTE:  OOS permanently?",
                //     name: "Xbox Series X",
                //     url: "https://www.gamestop.com/accessories/xbox-series-x/products/xbox-series-x/11108371.html?condition=New"
                // },
                // {
                //     ignore: true,
                //     // NOTE:  OOS permanently?",
                //     name: "PlayStation 5",
                //     url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5/B225169V.html"
                // },
                // {
                //     ignore: true,
                //     // NOTE:  OOS permanently?",
                //     name: "PlayStation 5 Digital Edition",
                //     url: "https://www.gamestop.com/video-games/playstation-5/consoles/products/playstation-5-digital-edition/B225171M.html"
                // }
            ]
        },

        {
            ignore: true,
            retailer: "Walmart",
            availableMatchConfigs: [
                {
                    selector: "div.prod-product-cta-add-to-cart > button",
                    targetPattern: "Add to cart",
                }
            ],
            unavailableMatchConfigs: [
                {
                    selector: "div.error-ErrorPage",
                    targetPattern: "This item is unavailable or on backorder"
                },
                {
                    selector: "#blitzitem-container",
                    targetPattern: "Out of stock"
                },
                {
                    // NOTE:  The standard(?) OOS button",
                    selector: "button.prod-ProductCTA--primary[data-tl-id='cta_oos_button']",
                    targetPattern: "Get in-stock alert"
                },
                {
                    // NOTE:  The standard(?) OOS message",
                    selector: "div.prod-ProductOffer-oosMsg",
                    targetPattern: "Out of stock"
                }
            ],
            priceMatchConfigs: [{
                selector: ".price-group",
                targetPattern: "\\$([0123456789\\.]+)"
            }],
            products: [
                {
                    control: true,
                    name: "onn. 128GB microSDXC Card with Adapter",
                    url: "https://www.walmart.com/ip/onn-128GB-microSDXC-Card-with-Adapter/772835319"
                },
                {
                    name: "PlayStation 5 Console",
                    url: "https://www.walmart.com/ip/PlayStation-5-Console/363472942"
                },
                {
                    name: "Sony PlayStation 5, Digital Edition",
                    url: "https://www.walmart.com/ip/Sony-PlayStation-5-Digital-Edition/493824815"
                },
                
                // {
                //     name: "Xbox Series X",
                //     url: "https://www.walmart.com/ip/Xbox-Series-X/443574645"
                // }
            ]
        },
    
        {
            ignore: false,
            // NOTE:  re-enable after calling Adorama on 2020-11-30 about bundle https://www.adorama.com/so3005718b.html",
            retailer: "Adorama",
            availableMatchConfigs: [{
                selector: "div.buy-section.purchase button.add-to-cart",
                targetPattern: "Add to Cart"
            }],
            unavailableMatchConfigs: [{
                selector: "div.buy-section.purchase button.add-to-cart",
                targetPattern: "Temporarily not available"
            }],
            products: [
                {
                    control: true,
                    name: "SanDisk 64GB Extreme PRO SDXC Memory Card, UHS-II Class 10 U3, Up to 300MB/s Read",
                    url: "https://www.adorama.com/idsdxpu264.html"
                },
                {
                    name: "PlayStation 5 825GB Gaming Console, Standard Edition",
                    url: "https://www.adorama.com/so3005718.html"
                },
                {
                    name: "PlayStation 5 825GB Gaming Console, Digital Edition",
                    url: "https://www.adorama.com/so3005719.html"
                },

                // {
                //     name: "Xbox Series X Bundle with Wireless Controller (White)",
                //     url: "https://www.adorama.com/xbrrt00001a.html"
                // },
                // {
                //     name: "Xbox Series X Bundle with Wireless Controller (Black)",
                //     url: "https://www.adorama.com/xbrrt00001b.html"
                // },
                // {
                //     name: "Xbox Series X Bundle with Wireless Controller (Shock Blue)",
                //     url: "https://www.adorama.com/xbrrt00001c.html"
                // }
            ]
        },

        {
            ignore: false,
            retailer: "Best Buy",
            cartUrl: "https://www.bestbuy.com/cart",
            checkoutUrl: "https://www.bestbuy.com/checkout/r/fast-track",
            availableMatchConfigs: [
                {
                    selector: "[id^='fulfillment-add-to-cart-button'] button",
                    targetPattern: "Add to Cart"
                },
                {
                    selector: "[id^='fulfillment-combo-add-to-cart-button'] button",
                    targetPattern: "Add to Cart"
                }
            ],
            unavailableMatchConfigs: [
                {
                    selector: "[id^='fulfillment-add-to-cart-button'] button",
                    targetPattern: "Sold Out|Shop Open-Box|Coming Soon|Unavailable Nearby"
                },
                {
                    selector: "[id^='fulfillment-combo-add-to-cart-button'] button",
                    targetPattern: "Sold Out|Shop Open-Box|Coming Soon|Unavailable Nearby"
                }
            ],
            products: [
                {
                    control: true,
                    name: "PS5: Call of Duty",
                    url: "https://www.bestbuy.com/site/call-of-duty-black-ops-cold-war-standard-edition-playstation-5/6427993.p?skuId=6427993"
                },
                {
                    name: "Playstation 5",
                    url: "https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p?skuId=6426149"
                },
                {
                    name: "Playstation 5 Digital Edition",
                    url: "https://www.bestbuy.com/site/sony-playstation-5-digital-edition-console/6430161.p?skuId=6430161"
                },

                // {
                //     name: "Xbox Series X",
                //     url: "https://www.bestbuy.com/site/microsoft-xbox-series-x-1tb-console-black/6428324.p?skuId=6428324"
                // },

                // {
                //     name: "Xbox Series S",
                //     url: "https://www.bestbuy.com/site/microsoft-xbox-series-s-512-gb-all-digital-console-disc-free-gaming-white/6430277.p?skuId=6430277"
                // },

                // {
                //     name: "Package - Xbox Series X + Controller",
                //     url: "https://www.bestbuy.com/site/combo/xbox-series-x-and-s-consoles/7298b293-4d51-43fd-adb4-ad00cfa76c4f"
                // },
                // {
                //     name: "Package - Xbox Series X + Halo Infinite",
                //     url: "https://www.bestbuy.com/site/combo/xbox-series-x-and-s-consoles/bae995a1-12d3-4bc1-a355-8666d4bb729f"
                // },
                // {
                //     name: "Package - Xbox Series X + Ubisoft Assassin's Creed Valhalla",
                //     url: "https://www.bestbuy.com/site/combo/xbox-series-x-and-s-consoles/35009727-f7d1-47df-8219-d68c6e83990c"
                // },
                // {
                //     name: "Package - Xbox Series X + WB Games Cyberpunk 2077",
                //     url: "https://www.bestbuy.com/site/combo/xbox-series-x-and-s-consoles/0946e97e-3a5d-40cf-a3f3-ec9b123a7415"
                // },
                // {
                //     name: "Package - Xbox Series X + Xbox Game Pass Ultimate 3 Month Membership",
                //     url: "https://www.bestbuy.com/site/combo/xbox-series-x-and-s-consoles/f2914681-c213-4542-8293-7376bfc10f61"
                // },
                // {
                //     name: "Package - Xbox Series X + Controller + Madden",
                //     url: "https://www.bestbuy.com/site/combo/xbox-series-x-and-s-consoles/7a3229b0-6beb-421c-b5ba-1a7a0d5bc63d"
                // }
            ]
        },

        {
            retailer: "B&H Photo",
            availableMatchConfigs: [{
                selector: "button[data-selenium='addToCartButton']",
                targetPattern: "Add to Cart"
            }],
            unavailableMatchConfigs: [{
                selector: "button[data-selenium='notifyAvailabilityButton']",
                targetPattern: "Notify When Available"
            }],
            products: [
                {
                    control: true,
                    name: "SanDisk 64GB Extreme PRO UHS-I SDXC Memory Card",
                    url: "https://www.bhphotovideo.com/c/product/1431033-REG/sandisk_sdsdxxy_064g_gn4in_extremepro_sdxc_64gb_card.html"
                },
                {
                    ignore: true,
                    name: "Sony PlayStation 5 Gaming Console",
                    url: "https://www.bhphotovideo.com/c/product/1595083-REG/sony_3005718_playstation_5_gaming_console.html",
                    // NOTE:  this seems to have been removed from inventory"
                },
                {
                    // NOTE:  no longer available as of 2020-12-15",
                    ignore: true,
                    name: "Microsoft Xbox Series X Gaming Console",
                    url: "https://www.bhphotovideo.com/c/product/1600080-REG/microsoft_rrt_00001_xbox_series_x_1tb.html"
                }
            ]
        },

        {
            retailer: "Newegg (standard products)",
            availableMatchConfigs: [{
                selector: "#ProductBuy button.btn-primary",
                targetPattern: "Add to cart"
            }],
            unavailableMatchConfigs: [
                {
                    selector: "#ProductBuy span.btn-message",
                    targetPattern: /Sold Out|Out of Stock/
                },
                {
                    selector: ".product-inventory",
                    targetPattern: /OUT OF STOCK/
                }
            ],
            products: [
                {
                    control: true,
                    name: "PlayStation 5 DualSense Wireless Controller",
                    url: "https://www.newegg.com/p/N82E16879261873"
                },
                {
                    name: "PS5 Bundle - Includes PS5 Console, Dualsense 5 Controller, Spider-man: Miles Morales Ultimate Edition and Sackboy: A Big Adventure",
                    url: "https://www.newegg.com/p/N82E16868110291"
                },
                {
                    name: "PS5 Bundle - Includes PS5 Console, Dualsense 5 Controller, Spider-Man: Miles Morales Launch Edition and Sackboy: A Big Adventure",
                    url: "https://www.newegg.com/p/N82E16868110293"
                },
                {
                    name: "PS5 Bundle - Includes PS5 Console and One Extra DualSense 5 Controller",
                    url: "https://www.newegg.com/p/N82E16868110292"
                }
            ]
        },

        {
            ignore: false,
            retailer: "Playstation.com (Sony official)",
            waitForSelector: ".productHero-info__price .js-actual-price:not(.hide)",
            availableMatchConfigs: [{
                selector: "producthero-info div.button-placeholder button.add-to-cart:not(.hide)",
                targetPattern: "Add"
            }],
            unavailableMatchConfigs: [{
                selector: "producthero-info div.button-placeholder div.out-stock-wrpr:not(.hide)",
                targetPattern: "Out of Stock"
            }],
            products: [
                {
                    control: true,
                    name: "PlayStation® 4 1TB Console",
                    url: "https://direct.playstation.com/en-us/consoles/console/playstation-4-1tb-console.3003348"
                },
                {
                    name: "PlayStation®5 Console",
                    url: "https://direct.playstation.com/en-us/consoles/console/playstation5-console.3005816"
                },
                {
                    name: "PlayStation®5 Digital Edition Console",
                    url: "https://direct.playstation.com/en-us/consoles/console/playstation5-digital-edition-console.3005817"
                }
            ]
        },

        {
            retailer: "Target (in-store pick-up)",
            // NOTE:  Target loads product pages dynamically, so we first have to wait for certain content to load before testing for a match.",
            waitForSelector: "[data-test='PDPFulfillmentSection'] [data-test='flexible-fulfillment']",
            navigationRetryMatchConfigs: [
                {
                    selector: "#viewport",
                    targetPattern: "Try refreshing the page",
                    // NOTE:  This may occur if a general error was encountered while loading the page."
                },
                {
                    selector: "[data-test='PDPFulfillmentSection'] [data-test='flexible-fulfillment'] [data-test='errorStateStore']",
                    targetPattern: "Refresh to view availability",
                    // NOTE:  This may materialize AFTER the waitForSelector has been satisfied."
                }
            ],
            availableMatchConfigs: [{
                selector: "[data-test='PDPFulfillmentSection'] [data-test='storeBlockOrderPickup'] button[data-test='orderPickupButton']",
                targetPattern: "Pick it up"
            }],
            unavailableMatchConfigs: [{
                selector: "[data-test='PDPFulfillmentSection'] [data-test='flexible-fulfillment']",
                targetPattern: "Out of stock|Sold out"
            }],
            products: [
                {
                    control: true,
                    name: "DualSense Wireless Controller for PlayStation 5",
                    url: "https://www.target.com/p/dualsense-wireless-controller-for-playstation-5/-/A-81114477"
                },
                {
                    name: "PlayStation 5 Console",
                    url: "https://www.target.com/p/playstation-5-console/-/A-81114595"
                },
                {
                    name: "PlayStation 5 Digital Edition Console",
                    url: "https://www.target.com/p/playstation-5-digital-edition-console/-/A-81114596"
                }
            ]
        },
        {
            retailer: "Target (shipped)",
            // NOTE:  Target loads product pages dynamically, so we first have to wait for certain content to load before testing for a match.",
            waitForSelector: "[data-test='PDPFulfillmentSection'] [data-test='flexible-fulfillment']",
            availableMatchConfigs: [{
                selector: "[data-test='PDPFulfillmentSection'] [data-test='shippingBlock'] button[data-test='shipItButton']",
                targetPattern: "Ship it"
            }],
            unavailableMatchConfigs: [{
                selector: "[data-test='PDPFulfillmentSection'] [data-test='flexible-fulfillment']",
                targetPattern: "This item isn't available for shipping|Sold out"
            }],
            elementToClickToAddToCart: "",
            products: [
                {
                    control: true,
                    name: "DualSense Wireless Controller for PlayStation 5",
                    url: "https://www.target.com/p/dualsense-wireless-controller-for-playstation-5/-/A-81114477"
                },
                {
                    name: "PlayStation 5 Console",
                    url: "https://www.target.com/p/playstation-5-console/-/A-81114595"
                },
                {
                    name: "PlayStation 5 Digital Edition Console",
                    url: "https://www.target.com/p/playstation-5-digital-edition-console/-/A-81114596"
                }
            ]
        },

        {
            retailer: "Costco",
            availableMatchConfigs: [{
                selector: "input#add-to-cart-btn[value='Add to Cart']",
                targetPattern: ""
            }],
            unavailableMatchConfigs: [{
                selector: "input#add-to-cart-btn[value='Out of Stock']",
                targetPattern: ""
            }],
            products: [
                {
                    control: true,
                    name: "Kirkland Signature Liquid Dish Soap, Citrus, 135 fl oz",
                    url: "https://www.costco.com/kirkland-signature-liquid-dish-soap%2c-citrus%2c-135-fl-oz.product.100491602.html"
                },
                {
                    name: "Sony PlayStation 5 Gaming Console Bundle",
                    url: "https://www.costco.com/sony-playstation-5-gaming-console-bundle.product.100691489.html"
                },
                // {
                //     name: "Xbox Series X 1TB Console with Additional Controller",
                //     url: "https://www.costco.com/xbox-series-x-1tb-console-with-additional-controller.product.100691493.html"
                // }
            ]
        }
        
    ]
}