/**
 * @file query.js
 *
 * A library script that contains all of the functionality associated with
 * querying the YouTube API for video data and analytics.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.query = ytpa.query || {};

    /** The maximum number of results that can be returned from any YouTube request. */
    ytpa.query.MAXRESULTS = 50;

    /**
     * Returns a promise that returns all of the playlist objects for a given user.
     */
    ytpa.query.playlists = function(user, numResults) {
        var uidRequestOptions = {
            part: 'id',
            forUsername: user,
        };

        var uidRequest = gapi.client.youtube.channels.list(uidRequestOptions);
        return uidRequest.then(function(response) {
            var channelID = response.result.items[0].id;
            var plidRequestOptions = {
                part: 'id',
                channelId: channelID,
            };

            return ytpa.query.items( gapi.client.youtube.playlists.list,
                plidRequestOptions, numResults );

        }).then(function(response) {
            var playlistInfoBatchRequest = gapi.client.newBatch();

            var playlistObjects = response;
            for(var playlistIdx in playlistObjects) {
                var playlistObject = playlistObjects[playlistIdx];
                var playlistOptions = { part: 'snippet,id', id: playlistObject.id };

                var playlistRequest = gapi.client.youtube.playlists.list(playlistOptions);
                playlistInfoBatchRequest.add(playlistRequest);
            }

            return playlistInfoBatchRequest;

        }).then(function(response) {
            var playlistResponseMap = response.result;

            var playlists = [];
            for(var playlistResponseID in playlistResponseMap) {
                var playlistResponse = playlistResponseMap[playlistResponseID];
                playlists.push(playlistResponse.result.items[0]);
            }

            return playlists;
        });
    };

    /**
     * Returns a promise that returns all of the upload objects for a given user.
     */
    ytpa.query.uploads = function(user, numResults) {
        var uplRequestOptions = {
            part: 'contentDetails',
            forUsername: user,
        };

        var uplRequest = gapi.client.youtube.channels.list(uplRequestOptions);
        return uplRequest.then(function(response) {
            var uploadsPLID = response.result.items[0].contentDetails.relatedPlaylists.uploads;
            var uplplRequestOptions = {
                part: 'contentDetails',
                playlistId: uploadsPLID,
            };

            return ytpa.query.items( gapi.client.youtube.playlistItems.list,
                uplplRequestOptions, numResults );

        }).then(function(response) {
            var playlistBatchRequest = gapi.client.newBatch();

            var playlistItems = response; 
            for(var videoIdx in playlistItems) {
                var videoID = playlistItems[videoIdx].contentDetails.videoId;
                var videoOptions = { part: 'snippet,id', id: videoID };

                var videoRequest = gapi.client.youtube.videos.list(videoOptions);
                playlistBatchRequest.add(videoRequest);
            }

            return playlistBatchRequest;

        }).then(function(response) {
            var playlistResponseMap = response.result;

            var playlistItems = [];
            for(var playlistResponseID in playlistResponseMap) {
                var videoResponse = playlistResponseMap[playlistResponseID];
                playlistItems.push(videoResponse.result.items[0]);
            }

            return playlistItems;
        });
    };

    /**
     * Returns a promise that contains all the videos in a playlist given its ID.
     */
    ytpa.query.playlistvideos = function(playlistID) {
        var requestOptions = {
            part: 'contentDetails',
            playlistId: playlistID,
        };

        return ytpa.query.items(gapi.client.youtube.playlistItems.list, requestOptions
        ).then(function(response) {
            var playlistBatchRequest = gapi.client.newBatch();

            var playlistItems = response; 
            for(var videoIdx in playlistItems) {
                var videoID = playlistItems[videoIdx].contentDetails.videoId;
                var videoOptions = { part: 'statistics,snippet', id: videoID };

                var videoRequest = gapi.client.youtube.videos.list(videoOptions);
                playlistBatchRequest.add(videoRequest);
            }

            return playlistBatchRequest;

        }).then(function(response) {
            var playlistResponseMap = response.result;

            var playlistItems = [];
            for(var playlistResponseID in playlistResponseMap) {
                var videoResponse = playlistResponseMap[playlistResponseID];
                if (videoResponse.result.items[0] !== undefined)
                    playlistItems.push(videoResponse.result.items[0]);
            }

            return playlistItems.sort(function(v1, v2) {
                return v1.snippet.publishedAt > v2.snippet.publishedAt ? 1 : -1;
            });;
        });
    };

    /**
     * Returns a promise that returns the items for a given request.
     */
    ytpa.query.items = function(requestFunction, requestOptions, numResults, _results) {
        var numResults = (numResults !== undefined) ? numResults : Number.POSITIVE_INFINITY;
        var _results = (_results !== undefined) ? _results : [];

        if(_results.length >= numResults) {
            return _results.slice(0, numResults);
        } else {
            requestOptions.maxResults = ytpa.query.MAXRESULTS;
            return requestFunction(requestOptions).then(function(response) {
                var nextRequestOptions = jQuery.extend(true, {}, requestOptions);
                nextRequestOptions.pageToken = response.result.nextPageToken;

                var nextRequestResults = _results.concat(response.result.items);
                var nextNumResults = Math.min(numResults,
                    response.result.pageInfo.totalResults);

                return ytpa.query.items(requestFunction, nextRequestOptions,
                    nextNumResults, nextRequestResults);
            });
        }
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
