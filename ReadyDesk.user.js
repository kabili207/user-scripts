// ==UserScript==
// @name         ReadyDesk Modifications
// @namespace    http://zyrenth.com/
// @version      0.1
// @description  Slight tweaks to make ReadyDesk suck less
// @author       Andrew Nagle
// @match        http://support.leedsworld.com/hd/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function decodeHtml(html) {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

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

    var ticketHeaderTbl = document.getElementById("headtable");

    if (ticketHeaderTbl) {
        console.log("Found header table");
        var cellIndex = -1;
        for (var i = 0; i < ticketHeaderTbl.rows[0].cells.length; i++) {

            if (ticketHeaderTbl.rows[0].cells[i].getAttribute("columnname") == "ASSIGNEDGROUP") {
                console.log("Found group column at index " + i);
                cellIndex = i;
                break;
            }
        }

        if (cellIndex > 1) {
            var ticketTbl = document.getElementById("bodytable");
            for (var i = 0; i < ticketTbl.rows.length; i++) {
                var decodedHtml = decodeHtml(ticketTbl.rows[i].cells[cellIndex].innerHTML).trim();
                //console.log("Row " + i + " " + decodedHtml);
                if (decodedHtml == "DevSupport") {
                    var baseColor = "#f0e0ff";
                    var darkColor = LightenDarkenColor(baseColor, -70);
                    var oddColor = LightenDarkenColor(baseColor, -10);

                    addGlobalStyle("tr#" + ticketTbl.rows[i].id + " td { background-color: " + baseColor +"; }");
                    addGlobalStyle("tr#" + ticketTbl.rows[i].id + ".odd td { background-color: " + oddColor + "; }");
                    addGlobalStyle("tr#" + ticketTbl.rows[i].id + ".selected td { background-color: " + darkColor + "; }");
                    //console.log('DevSupport');
                }
            }
        }
    }
})();