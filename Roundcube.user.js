// ==UserScript==
// @name         Roundcube Tweaks
// @namespace    http://zyrenth.com/
// @version      0.6
// @description  Tweaks to roundcube
// @author       Amy Nagle
// @match        https://mail.zyrenth.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @require http://userscripts-mirror.org/scripts/source/107941.user.js
// ==/UserScript==

(function() {
    'use strict';

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    function LightenDarkenColor(col, amt) {
        var usePound = false;
        if (col[0] == "#") {
            col = col.slice(1);
            usePound = true;
        }
        var num = parseInt(col,16);
        var r = (num >> 16) + amt;

        if (r > 255) r = 255;
        else if  (r < 0) r = 0;

        var b = ((num >> 8) & 0x00FF) + amt;

        if (b > 255) b = 255;
        else if  (b < 0) b = 0;

        var g = (num & 0x0000FF) + amt;

        if (g > 255) g = 255;
        else if (g < 0) g = 0;

        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    }

    function getForegroundColor(bgColor, lightColor, darkColor) {
        var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
        var r = parseInt(color.substring(0, 2), 16); // hexToR
        var g = parseInt(color.substring(2, 4), 16); // hexToG
        var b = parseInt(color.substring(4, 6), 16); // hexToB
        var uicolors = [r / 255, g / 255, b / 255];
        var c = uicolors.map((col) => {
            if (col <= 0.03928) {
                return col / 12.92;
            }
            return Math.pow((col + 0.055) / 1.055, 2.4);
        });
        var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
        return (L > 0.179) ? darkColor : lightColor;
    }

    addGlobalStyle(".messagelist tr.unread span.tb_label_dots { font-weight: normal; }");
    addGlobalStyle(
        "#messagelist tr.message td.subject { position: relative; }" +
        "#messagelist tr.message td.subject span.tb_label_dots { top: 0.75em; } "
    );

    var myFlags = GM_SuperValue.get("FlagConfig", [
        { flag:"STORY", color:"#33CCFF" },
        { flag:"HENTAI", color:"#FF6666" },
        { flag:"GOO", color:"#CC33FF" },
        { flag:"LOYALTY", color:"#000000" }
    ]);

    for (var i = 0; i < myFlags.length; i++) {
        var flagName = myFlags[i].flag;
        var flagColor = myFlags[i].color;
        var tagName = "tb_label_" + flagName;
        var foreColor = getForegroundColor(flagColor, '#FFFFFF', '#000000');

        addGlobalStyle(
            ".tb_label_dots span." + tagName + " { color: " + flagColor +"; } " +
            "#messagelist tr.selected." + tagName + " td, #messagelist tr.selected." + tagName + " td a { color: #FFFFFF; background-color: " + flagColor + "; } " +
            "#messagelist tr." + tagName + " td, #messagelist tr." + tagName + " td a, .toolbarmenu li." + tagName + ", .toolbarmenu li." + tagName + " a.active { color: " + flagColor + "; } " +
            "div#labelbox span.box_" + tagName + " { color: " + foreColor + "; background-color: " + flagColor + "; } "
        );

        var labelbox = document.querySelector("div#labelbox span.box_" + tagName);
        if(labelbox) {
            labelbox.innerHTML = flagName.toLowerCase();
        }
    }


})();