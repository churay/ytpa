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
        var numResults = (numResults !== undefined) ? numResults : 10;
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
                maxResults: numResults,
            };

            var plidRequest = gapi.client.youtube.playlists.list(plidRequestOptions);
            return plidRequest;

        }).then(function(response) {
            var playlistRObjs = response.result.items;
            var plinfoRequestOptions = {
                part: 'snippet',
                id: playlistRObjs.map(function(v, i, a){ return v.id; }).join(','),
                maxResults: numResults,
            };

            var plinfoRequest = gapi.client.youtube.playlists.list(plinfoRequestOptions);
            return plinfoRequest;

        }).then(function(response) {
            var playlistRObjs = response.result.items;
            var playlists = [];
            for(var playlistIdx in playlistRObjs)
                playlists.push(playlistRObjs[playlistIdx].snippet);

            return playlists;

        });
    };

    /**
     * Returns a promise that returns all of the upload objects for a given user.
     */
    ytpa.query.uploads = function(user, numResults) {
        var numResults = (numResults !== undefined) ? numResults : 10;
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
                maxResults: numResults,
            };

            var uplplRequest = gapi.client.youtube.playlistItems.list(uplplRequestOptions);
            return uplplRequest;

        }).then(function(response) {
            var playlistBatchRequest = gapi.client.newBatch();

            var playlistItems = response.result.items;
            for(var videoIdx in playlistItems) {
                var videoID = playlistItems[videoIdx].contentDetails.videoId;
                var videoOptions = { part: 'snippet', id: videoID };

                var videoRequest = gapi.client.youtube.videos.list(videoOptions);
                playlistBatchRequest.add(videoRequest);
            }

            return playlistBatchRequest;

        }).then(function(response) {
            var playlistResponseMap = response.result;

            var playlistItems = [];
            for(var playlistResponseID in playlistResponseMap) {
                var videoResponse = playlistResponseMap[playlistResponseID];
                playlistItems.push(videoResponse.result.items[0].snippet);
            }

            return playlistItems;

        });
    };

    /**
     * Returns a promise the returns all of the items for a given request.
     */
    ytpa.query.allitems = function(requestFunction, requestOptions, _results) {
        if(!("maxResults" in requestionsOptions))
            throw TypeError("Request options must define 'maxResults' field.");

        var _results = (_results !== undefined) ? _results : [];

        requestOptions.maxResults = Math.min(ytpa.query.MAXRESULTS, requestOptions.maxResults);
        requestOptions.pageToken = (_nextToken !== undefined) ? _nextToken : undefined;

        if(requestOptions.maxResults <= 0) {
            return new Promise(function(resolveFunction, errorFunction) {
                resolveFunction(_results);
            });
        } else {
            var ytRequest = requestFunction( requestOptions );
            return ytRequest.then(function(response) {
                var nextRequestOptions = jQuery.extend(true, {}, requestOptions);
                nextRequestOptions.maxResults = requestOptions.maxResults - ytpa.query.MAXRESULTS;
                nextRequestOptions.pageToken = response.result.nextPageToken;

                return ytpa.query.allitems(requestFunction, nextRequestOptions, _results + response.result.items);
            });
        }
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
