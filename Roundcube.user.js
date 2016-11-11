// ==UserScript==
// @name         Roundcube Tweaks
// @namespace    http://zyrenth.com/
// @version      0.1
// @description  Tweaks to roundcube
// @author       Andrew Nagle
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

    addGlobalStyle(".messagelist tr.unread span.tb_label_dots { font-weight: normal; }");
    
    var myFlags = GM_SuperValue.get("FlagConfig", [
        { flag:"STORY", color:"#33CCFF" },
        { flag:"HENTAI", color:"#FF6666" },
        { flag:"GOO", color:"#CC33FF" }
    ]);

    for (var i = 0; i < myFlags.length; i++) {
        var flagName = myFlags[i].flag;
        var flagColor = myFlags[i].color;
        var tagName = "tb_label_" + flagName;

        addGlobalStyle(
            ".tb_label_dots span." + tagName + " { color: " + flagColor +"; } " +
            "#messagelist tr.selected." + tagName + " td, #messagelist tr.selected." + tagName + " td a { color: #FFFFFF; background-color: " + flagColor + "; } " +
            "#messagelist tr." + tagName + " td, #messagelist tr." + tagName + " td a, .toolbarmenu li." + tagName + ", .toolbarmenu li." + tagName + " a.active { color: " + flagColor + "; } " +
            "div#labelbox span.box_" + tagName + " { background-color: " + flagColor + "; } "
        );
    }


})();