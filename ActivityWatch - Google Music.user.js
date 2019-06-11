// ==UserScript==
// @name         ActivityWatch - Google Music
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Track music data from Google Music
// @author       Amy Nagle
// @include      http://play.google.com/music/listen*
// @include      https://play.google.com/music/listen*
// @match        http://play.google.com/music/listen*
// @match        https://play.google.com/music/listen*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    var testing_mode = false;

    var check_interval = 5;
    var max_check_interval = 60;
    var heartbeat_interval = 20;
    var heartbeat_pulsetime = heartbeat_interval + max_check_interval;

    var gmusic_ads_metadata = {
        title: 'We\'ll be right back',
        artist: 'Subscribe to go ad-free'
    };

    var client = {
        testing: null,
        lastSyncSuccess: true,
        _getHost: function(){
            if(this.testing) {
                return "http://127.0.0.1:5666/";
            } else {
                return "http://127.0.0.1:5600/";
            }
        },

        setup: function() {
            console.log("Setting up client");
            // Check if in dev mode
            client.testing = testing_mode;
            client.createBucket();
        },

        getBucketId: function() {
            // TODO: This works for Chrome and Firefox, but is a bit hacky and wont work in the general case
            var browserName = /(Chrome|Firefox)\/([0-9.]+)/.exec(navigator.userAgent)[1];
            return "aw-watcher-google-music-" + browserName.toLowerCase();
        },

        createBucket: function(){
            if (this.testing === null)
                return;
            // TODO: We might want to get the hostname somehow, maybe like this:
            // https://stackoverflow.com/questions/28223087/how-can-i-allow-firefox-or-chrome-to-read-a-pcs-hostname-or-other-assignable
            var payload = {
                "client": "aw-watcher-google-music",
                "hostname": "unknown",
                "type": "currently-playing"
            };

            var bucket_id = client.getBucketId();

            var host = this._getHost();
            var url = host + "api/0/buckets/" + bucket_id;
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                data: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                onreadystatechange: function(xhr) {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200){
                            let resp = JSON.parse(xhr.responseText);
                            console.log("Bucket was successfully created");
                        }
                        else if (xhr.status === 400){
                            let resp = JSON.parse(xhr.responseText);
                            //console.log("Bucket already created");
                        }
                        else {
                            console.error("Unable to create bucket (statuscode: " + xhr.status + ")");
                        }
                    }
                }
            });
        },

        sendHeartbeat: function(timestamp, data, pulsetime) {
            if (this.testing === null)
                return;
            var host = this._getHost();
            var url = host + "api/0/buckets/" + client.getBucketId() + "/heartbeat?pulsetime=" + pulsetime;

            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                data: JSON.stringify({"data": data, "timestamp": timestamp.toISOString()}),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                onreadystatechange: function(xhr) {
                    // xhr.readyState === 4 means DONE with request
                    if (xhr.readyState === 4) {
                        if (xhr.status !== 200){
                            // ERROR
                            console.error("Status code: " + xhr.status + ", response: " + xhr.responseText);
                            if(client.lastSyncSuccess) {
                                GM_notification({
                                    text: "Please ensure that you are running an ActivityWatch server at: " + client._getHost(),
                                    title: "Unable to send event to server",
                                    image: "https://avatars3.githubusercontent.com/u/18249061",
                                });
                                client.lastSyncSuccess = false;
                            }
                        } else {
                            // SUCCESS
                            client.lastSyncSuccess = true;
                            GM_setValue("lastSync", new Date().toISOString());
                        }
                    }
                }
            });
        }
    };

    var last_heartbeat_data = null;
    var last_heartbeat_time = null;

    function is_advertisment(song) {
        return song.title === gmusic_ads_metadata.title &&
            song.artist === gmusic_ads_metadata.artist;
    }

    function heartbeat(player) {
        //console.log(JSON.stringify(tab));
        var now = new Date();
        var data = {
            "title": player.song.title,
            "artist": player.song.artist,
            "album": player.song.album,
            "album_artist": player.song.album_artist,
            //"uri": track['item']['uri']
        };
        if (player.has_song && player.is_playing && !is_advertisment(player)) {
            // First heartbeat on startup
            if (last_heartbeat_time === null){
                //console.log("aw-watcher-web: First");
                client.sendHeartbeat(now, data, heartbeat_pulsetime);
                last_heartbeat_data = data;
                last_heartbeat_time = now;
            }
            // Any tab data has changed, finish previous event and insert new event
            else if (JSON.stringify(last_heartbeat_data) != JSON.stringify(data)){
                //console.log("aw-watcher-web: Change");
                client.sendHeartbeat(new Date(now-1), last_heartbeat_data, heartbeat_pulsetime);
                client.sendHeartbeat(now, data, heartbeat_pulsetime);
                last_heartbeat_data = data;
                last_heartbeat_time = now;
            }
            // If heartbeat interval has been exceeded
            else if (new Date(last_heartbeat_time.getTime()+(heartbeat_interval*1000)) < now){
                //console.log("aw-watcher-web: Update");
                client.sendHeartbeat(now, data, heartbeat_pulsetime);
                last_heartbeat_time = now;
            }
        }
    }


    // Based on code from https://github.com/newgiin/cloudplayer-scrobbler

    /**
     * Player class
     *
     * Cloud Player page parser
     */
    function Player(parser) {
        this.has_song = parser.get_has_song();
        this.is_playing = parser.get_is_playing();
        this.song = {
            position: parser.get_song_position(),
            time: parser.get_song_time(),
            title: parser.get_song_title(),
            artist: parser.get_song_artist(),
            album_artist: parser.get_album_artist(),
            album: parser.get_song_album(),
            cover: parser.get_song_cover()
        };
    }

    var GoogleMusicParser = {

        get_has_song: function() {
            return document.getElementById("playerSongInfo").children.length > 0;
        },

        get_is_playing: function() {
            var play_btn = document.querySelector(".material-player-middle paper-icon-button[data-id='play-pause']");
            if (play_btn === null) {
                play_btn = document.querySelector(".material-player-middle sj-icon-button[data-id='play-pause']");
            }
            return play_btn !== null && play_btn.classList.contains("playing");
        },

        get_song_position: function() {
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
        },

        get_song_time: function() {
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
        },

        get_song_title: function() {
            // the text inside the div located inside element with id="playerSongTitle"
            var title_elm = document.getElementById("currently-playing-title");
            return title_elm ? title_elm.textContent : null;
        },

        get_song_artist: function() {
            var artist_elm = document.getElementById("player-artist");
            return artist_elm ? artist_elm.textContent : null;
        },

        get_album_artist: function() {
            var elm = document.querySelector("#playerSongInfo .player-album");
            if (!elm)
                return null;
            var album_artist = elm.getAttribute('data-id');
            if (album_artist)
                return decodeURIComponent(
                    album_artist.split('/')[1].replace(/\+/g, ' '));
            return null;
        },

        get_song_cover: function() {
            var elm = document.getElementById("playerBarArt");
            var albumImg = null;
            if (elm)
                albumImg = elm.getAttribute("src");
            if (albumImg)
                return albumImg;
            return null;
        },

        get_song_album: function() {
            var elm = document.querySelector("#playerSongInfo .player-album");
            return elm ? elm.textContent : null;
        }
    }

    client.setup();
    window.setInterval(function() {
        heartbeat(new Player(GoogleMusicParser));
    }, check_interval * 1000);

})();