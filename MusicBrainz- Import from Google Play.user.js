// ==UserScript==
// @name         MusicBrainz: Import from Google Play
// @namespace    http://zyrenth.com/
// @version      0.1
// @description  Import releases from Google Play
// @author       Amy Nagle
// @match        https://play.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var oldHref = document.location.href;

    window.onload = function() {

        var bodyList = document.querySelector("body")
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (oldHref != document.location.href) {
                    oldHref = document.location.href;
                    addMusicBrainz();
                }
            });
        });

        var config = {
            childList: true,
            subtree: true
        };

        observer.observe(bodyList, config);
    };

    addMusicBrainz();

    function addMusicBrainz() {

        if(/^https:\/\/play.google.com\/store\/music\/album\/.*\?id=/.exec(document.location.href)){

            var myform = document.createElement("form");
            myform.method="post";
            myform.target = "blank";
            myform.action = document.location.protocol + "//musicbrainz.org/release/add";
            myform.acceptCharset = "UTF-8";
            myform.style = "display: inline;";

            var mysubmit = document.createElement("input");
            mysubmit.type = "submit";
            mysubmit.value = "MusicBrainz";
            mysubmit.classList.add("play-button");
            mysubmit.classList.add("musicbrainz-submit");
            mysubmit.classList.add("mbBtn");
            myform.appendChild(mysubmit);

            var btnContainer = document.querySelector("div.details-actions div.details-actions-right");
            btnContainer.prepend(myform);

            function add_field (name, value) {
                var field = document.createElement("input");
                field.type = "hidden";
                field.name = name;
                field.value = value;
                myform.appendChild(field);
            }

            var elmInfoBox = document.querySelector('.details-info .info-box-top');
            var album = elmInfoBox.querySelector('.document-title span').textContent;
            var elmSubtitles = elmInfoBox.querySelector('.document-subtitles');
            var artist = elmSubtitles.querySelector('.left-info div[itemprop=byArtist] a').textContent;
            var dateRaw = elmSubtitles.querySelector('.left-info div[itemprop=byArtist]').cloneNode(true).childNodes[4].textContent;
            var date = new Date(Date.parse(dateRaw));
            var label = elmSubtitles.querySelector('.left-info div:not([itemprop]) div').textContent.trim().match(/^.\s+\d+\s+([\w\s]+)$/)[1];

            var urlParams = new URLSearchParams(window.location.search);
            var idParam = urlParams.get('id');
            var url = "https://play.google.com/store/music/album/?id=" + idParam;

            add_field("name", album);
            add_field("artist_credit.names.0.artist.name", artist);
            add_field("packaging", 'None');
            //add_field("date.test", date);
            add_field("date.year", date.getFullYear());
            add_field("date.month", date.getMonth() + 1);
            add_field("date.day", date.getDate());
            add_field("labels.0.name", label);
            add_field("country", 'XW');
            add_field("status", "official");

            //add_field("language", "jpn");
            //add_field("script", "Jpan");

            add_field("type", "Album");
            add_field("edit_note", "Imported from: "+ url +
                      " using Google Play Music Importer");
            add_field("urls.0.link_type", "74");
            add_field("urls.0.url", url);

            var discno = 0;
            add_field("mediums." + discno + ".format", 'Digital Media');
            var trackRows = document.querySelectorAll('tr.track-list-row');

            for (var i = 0; i < trackRows.length; i++) {
                var trackRow = trackRows[i];
                var trackNo = parseInt(trackRow.querySelector('.track-number').textContent) - 1;
                var trackName = trackRow.querySelector('.title').textContent;
                var _time = trackRow.querySelector('.duration').textContent;
                var duration;
                _time = _time.trim().split(':');
                if(_time.length == 2)
                {
                    duration = (parseInt(_time[0]) * 60 + parseInt(_time[1]));
                }
                else if (_time.length == 3)
                {
                    duration = (parseInt(_time[0]) * 3600 + parseInt(_time[1]) * 60 + parseInt(_time[2]));
                }
                add_field("mediums." + discno + ".track." + trackNo + ".name", trackName);
                add_field("mediums." + discno + ".track." + trackNo + ".length", duration * 1000);

                var artists = artist.split(/[,&]/);
                //for (var j = 0; j < artists.length; j++) {
                //    add_field("mediums." + discno + ".track." + trackNo + ".artist_credit.names." + j + ".name", artists[j].trim());
                //    var join_phrase = (j != artists.length - 1) ? (j == artists.length - 2) ? " & " : ", " : "";
                //    if (j != artists.length - 1)
                //        add_field("mediums." + discno + ".track." + trackNo + ".artist_credit.names." + j + ".join_phrase", join_phrase);
                //}
            }}
    }
})();