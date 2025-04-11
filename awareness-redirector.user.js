// ==UserScript==
// @name         Awareness Redirector
// @namespace    http://yournamespacehere.com/
// @version      1.3
// @description  Replace Temu link images with awareness images, display a message with the Uyghur flag as fallback, play the Uyghur national anthem, and then redirect to eBay
// @match        *://*.temu.com/*
// @match        *://*.ebay.com/*
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js
// ==/UserScript==

(function() {
    'use strict';

    const DDG_IMAGE_SEARCH_URL = 'https://duckduckgo.com/i.js?q=Uyghur+Muslims&kp=1'; // kp=1 enables Safe Search
    const CACHE_KEY = 'uyghur_images_cache';
    const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
    const RATE_LIMIT_DELAY = 1000; // 1 second delay to avoid hitting rate limits
    const MAX_RETRIES = 3; // Maximum number of retries for fetching images
    const SEARCH_QUERIES = [
        'Uyghur Muslims',
        'Uyghur Human Rights',
        'Uyghur Crisis'
    ]; // Different queries to try if fetching fails
    const UYGHUR_FLAG_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Flag_of_East_Turkestan.svg/1200px-Flag_of_East_Turkestan.svg.png'; // URL of the Uyghur flag
//    const UYGHUR_ANTHEM_URL = 'https://example.com/uyghur_national_anthem.mp3'; // URL of the Uyghur national anthem audio file
    const SPLASH_DISPLAY_TIME = 5000; // Time to display the splash page in milliseconds (5 seconds)

    // Function to cache data in localStorage
    function setCache(key, data) {
        const cacheData = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    }

    // Function to get data from cache
    function getCache(key) {
        const cacheData = JSON.parse(localStorage.getItem(key));
        if (cacheData && (Date.now() - cacheData.timestamp < CACHE_EXPIRY)) {
            return cacheData.data;
        }
        return null;
    }

    // Function to fetch images dynamically with caching, retries, and multiple queries
    async function fetchImages() {
        const cachedImages = getCache(CACHE_KEY);
        if (cachedImages) {
            return cachedImages;
        }

        let images = [];
        for (let query of SEARCH_QUERIES) {
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY)); // Rate limiting delay
                    const response = await axios.get(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&kp=1`);
                    images = response.data.results.map(result => result.image);
                    if (images.length > 0) {
                        setCache(CACHE_KEY, images);
                        return images;
                    }
                } catch (error) {
                    console.error(`Error fetching images for query "${query}" on attempt ${attempt + 1}:`, error);
                }
            }
        }

        return images;
    }

    // Function to display the splash page with an awareness message, image, and audio
    async function displaySplashPage() {
        const message = "Please be aware of the treatment of Uyghur Muslims in China.";
        const images = await fetchImages();
        const imageUrl = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : UYGHUR_FLAG_URL;

        const splash = document.createElement('div');
        splash.style.position = 'fixed';
        splash.style.top = '0';
        splash.style.left = '0';
        splash.style.width = '100%';
        splash.style.height = '100%';
        splash.style.backgroundColor = 'white';
        splash.style.zIndex = '9999';
        splash.style.display = 'flex';
        splash.style.flexDirection = 'column';
        splash.style.justifyContent = 'center';
        splash.style.alignItems = 'center';
        splash.style.textAlign = 'center';
        splash.style.padding = '20px';

        splash.innerHTML = `
            <p>${message}</p>
            <img src="${imageUrl}" alt="Uyghur Muslim" style="max-height: 200px;">
            <audio autoplay>
                <source src="${UYGHUR_ANTHEM_URL}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
        `;

        document.body.innerHTML = ''; // Clear the existing content
        document.body.appendChild(splash);

        // Redirect to eBay after the splash display time
        setTimeout(() => {
            const searchQuery = new URLSearchParams(window.location.search).get('q') || '';
            const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
            window.location.replace(ebayUrl);
        }, SPLASH_DISPLAY_TIME);
    }

    // Function to replace Temu link images with awareness images
    async function replaceTemuImages() {
        if (window.location.hostname.includes('temu.com')) {
            const images = await fetchImages();
            const replacementImages = images.length > 0 ? images : [UYGHUR_FLAG_URL];

            document.querySelectorAll('img').forEach((img) => {
                const randomImage = replacementImages[Math.floor(Math.random() * replacementImages.length)];
                img.src = randomImage;
            });
        }
    }

    // Function to display awareness message and image on eBay
    async function displayAwarenessMessage() {
        if (window.location.hostname.includes('ebay.com')) {
            const message = "Please be aware of the treatment of Uyghur Muslims in China.";
            const images = await fetchImages();
            const imageUrl = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : UYGHUR_FLAG_URL;

            const banner = document.createElement('div');
            banner.style.position = 'fixed';
            banner.style.top = '0';
            banner.style.left = '0';
            banner.style.width = '100%';
            banner.style.backgroundColor = 'yellow';
            banner.style.zIndex = '9999';
            banner.style.padding = '10px';
            banner.style.textAlign = 'center';
            banner.innerHTML = `<p>${message}</p><img src="${imageUrl}" alt="Uyghur Muslim" style="max-height: 100px;">`;

            document.body.appendChild(banner);
        }
    }

    // Execute the image replacement function for Temu
    replaceTemuImages();

    // Display the splash page on Temu and redirect to eBay
    if (window.location.hostname.includes('temu.com')) {
        displaySplashPage();
    }

    // Execute the message display function for eBay after a slight delay to ensure the page has loaded
    window.addEventListener('load',
