// ==UserScript==
// @name         Subscribe to Story
// @namespace    http://muffin.dev/
// @version      1.0
// @description  Directly subscribe to a story in FreshRSS
// @author       Amy Nagle
// @match        https://*.scribblehub.com/*
// @match        https://scribblehub.com/*
// @match        https://www.royalroad.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const FR_BASE = "https://rss.openmuffin.com/";
    const API_BASE = FR_BASE + "api/greader.php";
    const LOGO_URL = FR_BASE + "themes/icons/favicon.svg";

    const FR_USER = "kabili";
    const FR_PASS = "NiVxAmdPQ2xSJfBDo4n4";
    const FR_LABEL = "user/-/label/Stories";

    const STATE = {
        PENDING: "pending",
        ADDED: "added",
        FAILED: "failed",
        UNKNOWN: "unknown",
    }

    const location = window.location;
    const loadDate = Date.now();
    var currState = STATE.UNKNOWN;
    var feedUrl = location.href;
    var linkElement = null;
    var textElement = null;
    var baseStyles = [];

    var fr_auth = {};
    var fr_token = null;


    function setSubscribeState(status) {
        currState = status;
        linkElement.className = "";
        linkElement.classList.add(...baseStyles);

        switch (status) {
            case STATE.PENDING:
                linkElement.classList.add("fresh-pending");
                textElement.innerText = "Pending";
                break;
            case STATE.ADDED:
                linkElement.classList.add("fresh-added");
                textElement.innerText = "Subscribed!";
                break;
            case STATE.FAILED:
                linkElement.classList.add("fresh-failed");
                textElement.innerText = "Failed";
                break;
            default:
                linkElement.classList.add("fresh-normal");
                textElement.innerText = "Add Feed";
                break;
        }
    }

    function getFeedUrl() {
        setSubscribeState(STATE.PENDING);
        const http = new XMLHttpRequest();
        const url = new URL('https://feed.muffin.dev/api/feed');
        url.search = new URLSearchParams({ url: location.href }).toString();
        http.onload = e => {
            console.log(http.responseText);
            feedUrl = http.responseText;
            initReaderApi(checkIfSubscribed);
        }
        http.open("GET", url, true);
        http.send();
    }

    function checkIfSubscribed() {
        const url = new URL(API_BASE + "/reader/api/0/stream/contents/feed/" + encodeURIComponent(feedUrl));
        url.search = new URLSearchParams({
            n: 1, // Results to return
            //ck: Math.floor(Date.now() / 1000), // Current timestamp
            //nt: Math.floor(Date.now() / 1000), // Stop time
            client: "kabi-TM-Subscribe",
        }).toString();
        getReaderApi("GET", url, null, response => {
            var data = JSON.parse(response);
            setSubscribeState(data.items.length > 0 ? STATE.ADDED : STATE.UNKNOWN);
            console.log(data);
        });
    }

    function getReaderApi(method, url, data, callback) {
        const http = new XMLHttpRequest();
        http.onload = e => {
            callback(http.responseText);
        }
        http.onerror = e => {
            console.log(http.responseText);
        }
        http.open(method, url, true);
        http.setRequestHeader('Authorization','GoogleLogin auth='+fr_auth.Auth);
        if(method == "POST") {
            withToken(() => {
                data.append("T", fr_token);
                http.send(data);
            });
        } else {
            http.send(data);
        }
    }

    function initReaderApi(callback) {
        const http = new XMLHttpRequest();
        const url = new URL(API_BASE + "/accounts/ClientLogin");
        var data = new FormData();
        data.append("Email", FR_USER);
        data.append("Passwd", FR_PASS);
        http.onload = e => {
            var resp = http.responseText;
            console.log(resp);
            const pattern = /^(\w+)=(.+)$/gm;
            for (const [fullMatch, key, value] of resp.matchAll(pattern)) {
                fr_auth[key] = value === "null" ? null : value;
            }
            callback();
        }
        http.open("POST", url, true);
        http.send(data);
    }

    function withToken(callback) {
        if (fr_token !== null) {
            callback();
        } else {
            const http = new XMLHttpRequest();
            const url = new URL(API_BASE + "/reader/api/0/token");
            http.onload = e => {
                fr_token = http.responseText;
                callback();
            }
            http.open("GET", url, true);
            http.setRequestHeader('Authorization','GoogleLogin auth='+fr_auth.Auth);
            http.send();
        }
    }

    function addToFreshRSS() {
        if (currState == STATE.PENDING || currState == STATE.ADDED) {
            return;
        }
        setSubscribeState(STATE.PENDING);
        console.log("Adding " + location.href);

        const url = new URL(API_BASE + "/reader/api/0/subscription/edit");
        url.search = new URLSearchParams({ client: "kabi-TM-Subscribe", s:"feed/" + feedUrl }).toString();
        var data = new FormData();
        //data.append("s", "feed/" + feedUrl);
        data.append("ac", "subscribe");
        data.append("a", FR_LABEL);
        getReaderApi("POST", url, data, response => {
            setSubscribeState(response == "OK" ? STATE.ADDED : STATE.UNKNOWN);
        });
    };

    if (location.host.endsWith(".scribblehub.com")) {
        var navLinks = document.querySelector(".next_nav_links");
        var readButtons = document.querySelector(".read_buttons");

        GM_addStyle(`
                .btn-fresh .btn_read { margin-left: 5px; }
                .read_buttons { width: 350px; }
                .fresh-normal .btn_read,
                .fresh-normal .sa_tip
                    { border-color: #044673; background-color: #065992;}
                .fresh-added .btn_read,
                .fresh-added .sa_tip
                    { border-color: #45764b; background-color: #138221;}
                .fresh-failed .btn_read,
                .fresh-failed .sa_tip
                    { border-color: #8a1a18; background-color: #a61f1c;}
                .fresh-pending .btn_read,
                .fresh-pending .sa_tip
                    { border-color: #636363; background-color: #808080;}
            `);

        if (readButtons) {
            linkElement = document.createElement("a");
            baseStyles = ["btn-fresh"];
            linkElement.id = "__rss-add-feed";
            linkElement.onclick = e => addToFreshRSS();
            linkElement.classList.add(...baseStyles);
            readButtons.appendChild(linkElement);
            //readButtons.insertBefore(linkElement, readButtons.firstElementChild.nextSibling);


            var linkWrap = document.createElement("span");
            linkWrap.classList.add("btn_read");
            linkElement.appendChild(linkWrap);

            var linkIcon = document.createElement("i");
            linkIcon.classList.add("fa", "fa-feed", "lib_space");
            linkWrap.appendChild(linkIcon);

            textElement = document.createElement("span");
            textElement.innerText = "Add Feed";
            linkWrap.appendChild(textElement);

            getFeedUrl();

        } else if (navLinks) {

            var newDiv = document.createElement("div");
            newDiv.classList.add("support_author", "__rss-added-links");
            navLinks.parentNode.insertBefore(newDiv, navLinks.nextSibling);

            linkElement = document.createElement("a");
            baseStyles = ["sa_link"];
            linkElement.id = "__rss-add-feed";
            linkElement.onclick = e => addToFreshRSS();
            linkElement.classList.add(...baseStyles);
            newDiv.appendChild(linkElement);

            var linkWrap = document.createElement("span");
            linkWrap.classList.add("sa_tip");
            linkElement.appendChild(linkWrap);

            var img = document.createElement("img");
            img.src = LOGO_URL;
            img.classList.add("__rss-link-image");
            linkWrap.appendChild(img);

            textElement = document.createElement("span");
            textElement.innerText = "Add to FreshRSS";
            textElement.classList.add("tip_text","sa");
            linkWrap.appendChild(textElement);

            getFeedUrl();

        }
    }


})();