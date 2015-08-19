/**
 * @file query.js
 *
 * A library script that contains all of the functionality associated with
 * querying the YouTube API for video data and analytics.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.query = ytpa.query || {};

    /**
     * Creates a request to process the playlists for a user with the given function.
     */
    ytpa.query.processPlaylists = function(user, callback, numResults = 10) {
        var uidRequestOptions = {
            part: 'id',
            forUsername: user,
        };

        var uidRequest = gapi.client.youtube.channels.list(uidRequestOptions);

        uidRequest.then(function(response) {
            var channelID = response.result.items[0].id;
            var plidRequestOptions = {
                part: 'id',
                channelId: channelID,
                maxResults: numResults,
            };

            var plidRequest = gapi.client.youtube.playlists.list(plidRequestOptions);

            plidRequest.then(function(response) {
                var playlistRObjs = response.result.items;
                var plinfoRequestOptions = {
                    part: 'snippet',
                    id: playlistRObjs.map(function(v, i, a){ return v.id; }).join(','),
                    maxResults: numResults,
                };

                var plinfoRequest = gapi.client.youtube.playlists.list(plinfoRequestOptions);

                plinfoRequest.then(function(response) {
                    var playlistRObjs = response.result.items;
                    var playlists = [];
                    for(var playlistIdx in playlistRObjs)
                        playlists.push(playlistRObjs[playlistIdx].snippet);

                    callback(playlists);
                });
            });
        });
    };

    /**
     * Creates a request to process the uploads for a given user with the given function.
     */
    ytpa.query.processUploads = function(user, callback, numResults = 10) {
        var requestOptions = {
            part: 'contentDetails',
            forUsername: user,
        };

        var request = gapi.client.youtube.channels.list(requestOptions);

        request.then(function(response) {
            var uploadsPlaylistID = response.result.items[0].contentDetails.relatedPlaylists.uploads;
            ytpa.query.processPlaylist(uploadsPlaylistID, callback, numResults);
        });
    };

    /**
     * Creates a request to process the videos in the given playlist with the given function.
     */
    ytpa.query.processPlaylist = function(playlistID, callback, numResults = 10) {
        var requestOptions = {
            part: 'contentDetails',
            playlistId: playlistID,
            maxResults: numResults,
        };

        var request = gapi.client.youtube.playlistItems.list(requestOptions);

        request.then(function(response) {
            var playlistBatchRequest = gapi.client.newBatch();

            var playlistItems = response.result.items;
            for(var videoIdx in playlistItems) {
                var videoID = playlistItems[videoIdx].contentDetails.videoId;
                var videoOptions = { part: 'snippet', id: videoID };

                var videoRequest = gapi.client.youtube.videos.list(videoOptions);
                playlistBatchRequest.add(videoRequest);
            }

            playlistBatchRequest.then(function(response) {
                var playlistResponseMap = response.result;
                var playlistItems = [];
                for(var playlistResponseID in playlistResponseMap) {
                    var videoResponse = playlistResponseMap[playlistResponseID];
                    playlistItems.push(videoResponse.result.items[0].snippet);
                }

                callback(playlistItems);
            });
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
