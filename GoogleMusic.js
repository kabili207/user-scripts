// ==UserScript==
// @name         Google Music Forwarder
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse Google Music
// @author       Andrew Nagle
// @include      http://play.google.com/music/listen*
// @include      https://play.google.com/music/listen*
// @match        http://play.google.com/music/listen*
// @match        https://play.google.com/music/listen*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // Based on code from https://github.com/newgiin/cloudplayer-scrobbler

    /**
     * contentscripts.js
     * Parses player page and transmit song information to background page
     * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>, Brad Lambeth <brad@lambeth.us>
     * Licensed under the MIT license
     */

    /**
     * Player class
     *
     * Cloud Player page parser
     */
    function Player(parser) {
        this.has_song = parser._get_has_song();
        this.is_playing = parser._get_is_playing();
        this.song = {
            position: parser._get_song_position(),
            time: parser._get_song_time(),
            title: parser._get_song_title(),
            artist: parser._get_song_artist(),
            album_artist: parser._get_album_artist(),
            album: parser._get_song_album(),
            cover: parser._get_song_cover()
        };
    }

    /**
     * Constructor for parser class
     * Executes scripts to fetch now playing info from cloudplayer
     * @returns {GoogleMusicParser}
     */
    function GoogleMusicParser() {

    }

    /**
     * Check whether a song loaded into player widget
     *
     * @return true if some song is loaded, otherwise false
     */
    GoogleMusicParser.prototype._get_has_song = function() {
        return document.getElementById("playerSongInfo").children.length > 0;
    };

    /**
     * Checks whether song is playing or paused
     *
     * @return true if song is playing, false if song is paused
     */
    GoogleMusicParser.prototype._get_is_playing = function() {
        var play_btn = document.querySelector(".material-player-middle paper-icon-button[data-id='play-pause']");
        if (play_btn === null) {
            play_btn = document.querySelector(".material-player-middle sj-icon-button[data-id='play-pause']");
        }
        return play_btn !== null && play_btn.classList.contains("playing");
    };

    /**
     * Get current song playing position
     *
     * @return Playing position in seconds
     */
    GoogleMusicParser.prototype._get_song_position = function() {
        var _time = document.getElementById("time_container_current").textContent;
        _time = _time.trim().split(':');
        if(_time.length == 2)
        {
            return (parseInt(_time[0]) * 60 + parseInt(_time[1]));
        }
        else if (_time.length == 3)
        {
            return (parseInt(_time[0]) * 3600 + parseInt(_time[1]) * 60 + parseInt(_time[2]));
        }
        return null;
    };

    /**
     * Get current song length
     *
     * @return Song length in seconds
     */
    GoogleMusicParser.prototype._get_song_time = function() {
        var _time = document.getElementById("time_container_duration").textContent;
        _time = _time.trim().split(':');
        if(_time.length == 2) {
            return (parseInt(_time[0]) * 60 + parseInt(_time[1]));
        }
        else if (_time.length == 3)
        {
            return (parseInt(_time[0]) * 3600 + parseInt(_time[1]) * 60 + parseInt(_time[2]));
        }
        return null;
    };

    /**
     * Get current song title
     *
     * @return Song title
     */
    GoogleMusicParser.prototype._get_song_title = function() {
        // the text inside the div located inside element with id="playerSongTitle"
        var title_elm = document.getElementById("currently-playing-title");
        return title_elm ? title_elm.textContent : null;
    };

    /**
     * Get current song artist
     *
     * @return Song artist
     */
    GoogleMusicParser.prototype._get_song_artist = function() {
        var artist_elm =  document.getElementById("player-artist");
        return artist_elm ? artist_elm.textContent : null;
    };

    /**
     * Get current song album artist
     *
     * @return The album artist
     */
    GoogleMusicParser.prototype._get_album_artist = function() {
        var elm = document.querySelector("#playerSongInfo .player-album");
        if (!elm)
            return null;
        var album_artist = elm.getAttribute('data-id');
        if (album_artist)
            return decodeURIComponent(
                album_artist.split('/')[1].replace(/\+/g, ' '));
        return null;
    };

    /**
     * Get current song artwork
     *
     * @return Image URL or default artwork
     */
    GoogleMusicParser.prototype._get_song_cover = function() {
        var elm = document.getElementById("playerBarArt");
        var albumImg = null;
        if (elm)
            albumImg = elm.getAttribute("src");
        if (albumImg)
            return albumImg;
        return null;
    };

    /**
     * Get current song album name
     *
     * @return Album name or null
     */
    GoogleMusicParser.prototype._get_song_album = function() {
        var elm = document.querySelector("#playerSongInfo .player-album");
        return elm ? elm.textContent : null;
    };

    var scrobble = true;
    var refresh_interval = 2;
    var gmusic_ads_metadata = {
        title: 'We\'ll be right back',
        artist: 'Subscribe to go ad-free'
    };

    var player = {}; // Previous player state
    var time_played = 0;
    var last_refresh = (new Date()).getTime();
    var curr_song_title = '';
    var last_state = 'NONE';

    var scrobble_point = 0.7;
    var scrobble_interval = 5; // 5 seconds
    var max_scrobbles = Number.POSITIVE_INFINITY;


    /**
     * New message arrives to the port
     */
    function port_on_message(message) {
        // Current player state
        var _p = message;
        var now = (new Date()).getTime();

        // Save player state
        player = _p;

        if (!scrobble) {
            return;
        }

        if (_p.has_song) {
            // if the song changed or looped
            if (_p.song.title != curr_song_title ||
                _p.song.position <= refresh_interval) {
                curr_song_title = _p.song.title;
                time_played = 0;
                last_refresh = now - refresh_interval * 1000;
                if (_p.is_playing) {
                    last_state = 'CHANGED';
                }
            }

            if (_p.is_playing) {

                if (last_state != 'PLAYING' && time_played >= scrobble_interval && !is_advertisment(_p.song)) {
                    scrobble_song(_p);
                    time_played = 0;
                    last_state = 'PLAYING';
                } else {
                    /*
                     * Don't depend on the refresh_interval to
                     * calculate time_played since there can be a significant delay
                     * between the time the message was sent from the contentscript
                     * to when it's recieved here.
                     * See: https://github.com/newgiin/cloudplayer-scrobbler/issues/23
                     */
                    time_played += (now - last_refresh) / 1000;
                }

                // TODO: Send track details?
            } else {
                if (last_state != 'PAUSED') {
                    scrobble_song(_p);
                    last_state = 'PAUSED';
                }
            }
        } else {
            if(last_state != 'STOPPED') {
                scrobble_song(_p);
                last_state = 'STOPPED';
            }
        }
        last_refresh = now;
    }


    function scrobble_song(song_data) {
        // TODO: do something with it
        console.log(song_data);
        var data = JSON.stringify(song_data);
        console.log(data);

        GM_xmlhttpRequest({
            method: "POST",
            url: "http://localhost:6305/",
            data: data,
            timeout: 2000,
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {

            }
        });

        //console.log('New track: ' + title + ' by ' + album_artist + ' (' + artist + ') on ' + album + ' time: ' + time);
    }

    function is_advertisment(song) {
        return song.title === gmusic_ads_metadata.title &&
            song.artist === gmusic_ads_metadata.artist;
    }

    window.addEventListener("beforeunload", function() {
        scrobble_song({"has_song":false,"is_playing":false,"song":{"position":0,"time":0,"title":"","artist":"","album_artist":null,"album":"","cover":null}});
    }, false);

    window.setInterval(function() {
        port_on_message(new Player(new GoogleMusicParser()));
    }, refresh_interval * 1000);

})();