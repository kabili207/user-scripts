// ==UserScript==
// @name         Roundcube Tweaks
// @namespace    http://zyrenth.com/
// @version      0.9
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
        var c = uicolors.map(function(col) {
            if (col <= 0.03928) {
                return col / 12.92;
            }
            return Math.pow((col + 0.055) / 1.055, 2.4);
        });
        var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
        return (L > 0.179) ? darkColor : lightColor;
    }

    function getRcName(flag) {
        return flag.replace('$', '').replace('\\', '').toUpperCase();
    }

    addGlobalStyle(
        ".messagelist tr.unread span.tb_label_dots { font-weight: normal; } " +
        "#messagelist tr.message td.subject { position: relative; } " +
        "#messagelist tr.message td.subject span.tb_label_dots { float: right; position: relative; top: 0.65em; } "
    );

    var myFlags = GM_SuperValue.get("FlagConfig", [
        { flag:"$story", color:"#33CCFF", text:"Story Updates" },
        { flag:"$hentai", color:"#FF6666", text:"Hentai" },
        { flag:"$goo", color:"#CC33FF", text:"Goo" },
        { flag:"$loyalty", color:"#000000", text:"Loyalty Programs" }
    ]);

    for (var i = 0; i < myFlags.length; i++) {
        var flagName = myFlags[i].flag;
        var flagRcName = getRcName(flagName);
        var flagColor = myFlags[i].color;
        var tagName = "tb_label_" + flagRcName;
        var foreColor = getForegroundColor(flagColor, '#FFFFFF', '#000000');

        addGlobalStyle(
            ".tb_label_dots span." + tagName + " { color: " + flagColor +"; } " +
            "#messagelist tr.selected." + tagName + " td, #messagelist tr.selected." + tagName + " td a { color: #FFFFFF; background-color: " + flagColor + "; } " +
            "#messagelist tr." + tagName + " td, #messagelist tr." + tagName + " td a, .toolbarmenu li." + tagName + ", .toolbarmenu li." + tagName + " a.active { color: " + flagColor + "; } " +
            "div#labelbox span.box_" + tagName + " { color: " + foreColor + "; background-color: " + flagColor + "; } "
        );

        var labelbox = document.querySelector("div#labelbox span.box_" + tagName);
        if(labelbox) {
            labelbox.innerHTML = myFlags[i].text;
        }
    }

    var labelLinks = document.querySelectorAll("div#tb_label_popup li");

    var labelMaps = [
        { data: 'LABEL1', flag: '$label1' },
        { data: 'LABEL2', flag: '$label2' },
        { data: 'LABEL3', flag: '$label3' },
        { data: 'LABEL4', flag: '$label4' },
        { data: 'LABEL5', flag: '$label5' }
    ];

    console.log(labelMaps);
    for (var i = 0; i < labelLinks.length; i++) {
        var label = labelLinks[i];

        for (var j = 0; j < labelMaps.length; j++) {
            var map = labelMaps[j];
            console.log(map);
            if(label.dataset.labelname == map.data) {
                label.dataset.labelname = map.flag;
            }
        }
    }


    window.addEventListener('load', function() {
        var messages = document.querySelectorAll("table.messagelist tr.message");

        for (var i = 0; i < messages.length; i++) {
            var message = messages[i];
            var subject = message.querySelector(".subject");
            var subjectLink = subject.querySelector("a");
            var labels = subject.querySelector(".tb_label_dots");
            addGlobalStyle(
                " #messagelist  tr#" + message.id + " td.subject { padding-right: "+ (labels.offsetWidth + 3) + "px; }" +
                " #messagelist  tr#" + message.id + " td.subject .tb_label_dots { margin-right: "+ (labels.offsetWidth * -1 - 3) + "px; }"
                );
            subject.appendChild(subjectLink);
        }
    }, false);



})();