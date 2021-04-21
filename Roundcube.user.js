// ==UserScript==
// @name         Roundcube Tweaks
// @namespace    http://zyrenth.com/
// @version      1.1
// @description  Tweaks to roundcube
// @author       Amy Nagle
// @match        https://mail.zyrenth.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @require      http://userscripts-mirror.org/scripts/source/107941.user.js
// @icon         https://mail.zyrenth.com/skins/elastic/images/favicon.ico
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

    // Icons
    // See FontAwesome for more https://fontawesome.com/icons?d=gallery&s=solid&m=free
    // Star - f005
    // Tag - f02b
    var myFlags = GM_SuperValue.get("FlagConfig", [
        { flag:"$story", color:"#33CCFF", text:"Story Updates", icon: 'f02d' /* book */ },
        { flag:"$hentai", color:"#FF6666", text:"Hentai", icon: 'f02b' },
        { flag:"$goo", color:"#CC33FF", text:"Goo", icon: 'f02b' },
        { flag:"$loyalty", color:"#000000", text:"Loyalty Programs", icon: 'f005' /* star */ },
        { flag:"$tracking", color:"#000000", text:"Tracking", icon: 'f48b' /* shipping-fast */ },
        { flag:"$finance", color:"#009900", text:"Financial", icon: 'f53a' /* money-bill-wave */ },
        { flag:"$bill", color:"#009900", text:"Bill", icon: 'f571' /* file-invoice-dollar */ }
    ]);

    for (var i = 0; i < myFlags.length; i++) {
        var flagName = myFlags[i].flag;
        var flagRcName = getRcName(flagName);
        var flagColor = myFlags[i].color;
        var tagName = "tb_label_" + flagRcName;
        var foreColor = getForegroundColor(flagColor, '#FFFFFF', '#000000');

        addGlobalStyle(
            "." + tagName + " .fromto:before { content: '\\" + myFlags[i].icon + "'; color: " + flagColor + "; font-weight: 900; font-family: 'Icons'; padding-right: 0.4rem; margin-left: -1.25rem; }" +
            ".tb-detail-link_" + flagRcName + ":before { content: '\\" + myFlags[i].icon + "'; color: " + flagColor + "; }"
        );

        var headerLinks = document.querySelector("#message-header .short-header div.header-links");
        if(headerLinks) {
            var messageLabels = unsafeWindow.tb_labels_for_message;
            if (messageLabels.includes(flagRcName)) {
                console.log("Adding flag " + flagRcName);
                var flagLink = document.createElement("a");
                flagLink.setAttribute('href', '#');
                flagLink.setAttribute('onclick', 'return false;');
                flagLink.innerText = myFlags[i].text;
                flagLink.classList.add("tb-detail-link_" + flagRcName);
                headerLinks.append(flagLink);
            }
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
        }
    }, false);



})();