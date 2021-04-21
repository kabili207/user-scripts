// ==UserScript==
// @name         Scribble Hub Custom Emoji
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Amy Nagle
// @match        https://www.scribblehub.com/*
// @icon         https://scribblehub.com/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://userscripts-mirror.org/scripts/source/107941.user.js
// ==/UserScript==

(function() {
    'use strict';

    /*
this will hold an object containing your custom emojis
as an example, here's what one of Scribble's emojis would look like:

const customEmojis = {
    "Blob Cookie": "https://www.scribblehub.com/wp-content/themes/writeit-child/emojis/blobs/blob_cookie_3.png",
};

basically, the format is: "name": "url",
*/
    const customEmojis = {
        "Blob Cookie": "https://www.scribblehub.com/wp-content/themes/writeit-child/emojis/blobs/blob_cookie_3.png",
    };


    // implementation
    function addCustomEmoji(element) {
        const emoji = document.createElement("img");
        emoji.id = "emoji_list";
        emoji.src = element.firstElementChild.src;
        emoji.classList.add("mceSmilieSprite", "mceSmilie35", "sp-wrap-yellow", "mce-charmap");
        emoji.title = element.title;
        emoji.width = 24;
        emoji.height = 24;

        pasteHtmlAtCaret(emoji.outerHTML, document.findElementById("#cmt_blob").value);
    }

    function replaceEmojisPanel() {
        const tabs = document.querySelector("[onclick=\"insert_emoji(this);\"]")?.closest("#tabs");
        if (!tabs) {
            return;
        }

        const tabList = tabs.querySelector("[role=\"tablist\"]");

        const tabHeader = document.createElement("li");
        tabHeader.ariaSelected = false;
        tabHeader.ariaExpanded = false;
        tabHeader.onclick = e => cmt_focus();
        tabHeader.tabIndex = -2;
        tabHeader.setAttribute("role", "tab");
        tabHeader.setAttribute("aria-labelledby", "ui-id-custom");
        tabHeader.setAttribute("aria-controls", "tabs-custom");
        tabHeader.classList.add("ui-tabs-tab","ui-corner-top","ui-state-default","ui-tab");
        tabList.appendChild(tabHeader);

        const tabTitle = document.createElement("a");
        tabTitle.setAttribute("href", "#tabs-custom");
        tabTitle.setAttribute("role", "presentation");
        tabTitle.text = "Custom";
        tabTitle.tabIndex = -2;
        tabTitle.classList.add("ui-tabs-anchor");
        tabTitle.id = "ui-id-custom";
        tabHeader.appendChild(tabTitle);

        const customTab = document.createElement("div");
        customTab.id = "tabs-custom";
        customTab.ariaHidden = true;
        customTab.onclick = e => cmt_focus();
        customTab.setAttribute("role", "tabpanel");
        customTab.setAttribute("unselectable", "on");
        customTab.setAttribute("aria-labelledby", "ui-id-custom");
        customTab.classList.add("ui-tabs-panel","ui-corner-bottom","ui-widget-content");

        //panel.classList.add("chirimoji-panel");

        tabs.appendChild(customTab);
        for (const [name, url] of Object.entries(customEmojis)) {
            const emojiWrapper = document.createElement("span");
            emojiWrapper.id = "fa-list";
            emojiWrapper.title = name;
            emojiWrapper.onclick = e => addCustomEmoji(emojiWrapper);
            customTab.appendChild(emojiWrapper);

            const emoji = document.createElement("img");
            emoji.id = "rl-list-fa";
            emoji.border = 0;
            emoji.src = url;
            emojiWrapper.appendChild(emoji);
        }

        $( "#tabs" ).tabs("refresh");

    }


    setTimeout(replaceEmojisPanel, 100);

    //var old_insert = insert_emoji;
    //insert_emoji = function(arg) {
    //    old_insert(arg);
    //}

})();