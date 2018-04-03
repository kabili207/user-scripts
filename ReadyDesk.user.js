// ==UserScript==
// @name         ReadyDesk Modifications
// @namespace    http://zyrenth.com/
// @version      0.4
// @description  Slight tweaks to make ReadyDesk suck less
// @author       Amy Nagle
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

        var login_elems = parent.frames["hd_top_frame"].document.getElementsByClassName("normbold");
        var re_login = /^Logged on as ([\w-]+)/;
        var login_name = null;

        for (var i = 0; i < login_elems.length; i++) {
            var re_results = re_login.exec(login_elems[i].innerText);
            if (re_results.length > 0) {
                login_name = re_results[1];
                console.log("Found user " + login_name);
                break;
            }
        }

        var highlightVariables = [
            { key:"ASSIGNEDGROUP", value: "DevSupport", color:"#f0e0ff", index:-1 },
            { key:"ASSIGNEDTO", value: login_name, color:"#9bedff", index:-1 },
            { key:"STATUS", value: "Deferred", color:"#f7f7f7", index:-1 },
            { key:"STATUS", value: "High", color:"#ff8080", index:-1 }
        ];

        console.log("Found header table");
        for (var i = 0; i < ticketHeaderTbl.rows[0].cells.length; i++) {

            for (var j = 0; j < highlightVariables.length; j++) {
                if (ticketHeaderTbl.rows[0].cells[i].getAttribute("columnname") == highlightVariables[j].key) {
                    console.log("Found " + highlightVariables[j].key + " at index " + i);
                    highlightVariables[j].index = i;
                }
            }
        }

        var ticketTbl = document.getElementById("bodytable");
        for (var i = 0; i < ticketTbl.rows.length; i++) {
            for (var j = 0; j < highlightVariables.length; j++) {
                var highlight = highlightVariables[j];

                if (highlight.index > -1) {
                    var decodedHtml = decodeHtml(ticketTbl.rows[i].cells[highlight.index].innerHTML).trim();
                    if (decodedHtml == highlight.value) {
                        var baseColor = highlight.color;
                        var darkColor = LightenDarkenColor(baseColor, -70);
                        var oddColor = LightenDarkenColor(baseColor, -10);

                        addGlobalStyle("tr#" + ticketTbl.rows[i].id + " td { background-color: " + baseColor +"; }");
                        addGlobalStyle("tr#" + ticketTbl.rows[i].id + ".odd td { background-color: " + oddColor + "; }");
                        addGlobalStyle("tr#" + ticketTbl.rows[i].id + ".selected td { background-color: " + darkColor + "; }");
                        console.log('DevSupport');
                    }
                }
            }
        }
    }
})();