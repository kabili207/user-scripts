// ==UserScript==
// @name         Scribble Hub Custom Emoji
// @namespace    http://tampermonkey.net/
// @version      0.3
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

    // TODO: Store and retrieve these with GM_getValue/GM_setValue
    const customEmojis = {
        "Meow Happy Paws": "https://cdn.discordapp.com/emojis/471640366093828096.gif?size=32",
        "Meow Vibing": "https://cdn.discordapp.com/emojis/747680206734622740.gif?size=32",
        "Meow Sweat": "https://cdn.discordapp.com/emojis/679885141958590505.png?size=32",
        "Meow Nom Cookie": "https://cdn.discordapp.com/emojis/778655754621419540.gif?size=32",
        "Meow Party": "https://cdn.discordapp.com/emojis/455135569287315496.gif?size=32",
        "Meow Huggies": "https://cdn.discordapp.com/emojis/621634488220385290.png?size=32",
        "Meow Melm": "https://cdn.discordapp.com/emojis/474939589992120332.png?size=32",
    };


    // implementation
    function addCustomEmoji(element) {
        const emoji = document.createElement("img");
        emoji.id = "emoji_list";
        emoji.src = element.firstElementChild.src;
        emoji.classList.add("mceSmilieSprite"/*, "mceSmilie35", "sp-wrap-default", "mce-charmap"*/);
        emoji.title = element.title;
        emoji.width = 23;
        emoji.height = 23;

        pasteHtmlAtCaret(emoji.outerHTML, document.getElementById("cmt_blob").value);
    }

    window.addEventListener("click", event => {
        const chirimoji = event.target.closest(".custom-emoji");
        if (chirimoji) {
            addCustomEmoji(chirimoji);
        }
    });

    function replaceEmojisPanel() {
        const tabs = document.querySelector("[onclick=\"insert_emoji(this);\"]")?.closest("#tabs");
        if (!tabs) {
            return;
        }

        const tabList = tabs.querySelector("[role=\"tablist\"]");

        // onclick needs to be set through attributes, otherwise comment replies/edits won't work
        const tabHeader = document.createElement("li");
        tabHeader.ariaSelected = false;
        tabHeader.ariaExpanded = false;
        tabHeader.tabIndex = -2;
        tabHeader.setAttribute("role", "tab");
        tabHeader.setAttribute("onclick", "cmt_focus();");
        tabHeader.setAttribute("aria-labelledby", "ui-id-custom");
        tabHeader.setAttribute("aria-controls", "tabs-custom");
        tabHeader.classList.add("ui-tabs-tab","ui-corner-top","ui-state-default","ui-tab");
        tabList.appendChild(tabHeader);

        const tabTitle = document.createElement("a");
        tabTitle.id = "ui-id-custom";
        tabTitle.text = "Custom";
        tabTitle.tabIndex = -2;
        tabTitle.setAttribute("href", "#tabs-custom");
        tabTitle.setAttribute("role", "presentation");
        tabTitle.classList.add("ui-tabs-anchor");
        tabHeader.appendChild(tabTitle);

        const customTab = document.createElement("div");
        customTab.id = "tabs-custom";
        customTab.ariaHidden = true;
        tabHeader.setAttribute("onclick", "cmt_focus();");
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
            emojiWrapper.classList.add("custom-emoji");
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