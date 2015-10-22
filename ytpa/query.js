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

            return ytpa.query.allitems( gapi.client.youtube.playlists.list,
                plidRequestOptions );

        }).then(function(response) {
            var playlistInfoBatchRequest = gapi.client.newBatch();

            var playlistObjects = response;
            for(var playlistIdx in playlistObjects) {
                var playlistObject = playlistObjects[playlistIdx];
                var playlistOptions = { part: 'snippet', id: playlistObject.id };

                var playlistRequest = gapi.client.youtube.playlists.list(playlistOptions);
                playlistInfoBatchRequest.add(playlistRequest);
            }

            return playlistInfoBatchRequest;

        }).then(function(response) {
            var playlistResponseMap = response.result;

            var playlists = [];
            for(var playlistResponseID in playlistResponseMap) {
                var playlistResponse = playlistResponseMap[playlistResponseID];
                playlists.push(playlistResponse.result.items[0].snippet);
            }

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

            return ytpa.query.allitems( gapi.client.youtube.playlistItems.list,
                uplplRequestOptions );

        }).then(function(response) {
            var playlistBatchRequest = gapi.client.newBatch();

            var playlistItems = response; 
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
     * Returns a promise that contains all the objects(information) in a playlist given a playlist id.
     * 
     * Information contains:
     * Title, id, channelId, description
     * CommentCount, dislikeCount, likeCount, favoriteCount, viewCount
     */
    ytpa.query.playlistvideos = function(playlistID) {
        var requestOptions = {
            part: 'contentDetails',
            playlistId: playlistID,
            maxResults: 100,
        };

        return ytpa.query.allitems(gapi.client.youtube.playlistItems.list, requestOptions
        ).then(function(response) {
            var playlistBatchRequest = gapi.client.newBatch();

            var playlistItems = response; 
            for(var videoIdx in playlistItems) {
                var videoID = playlistItems[videoIdx].contentDetails.videoId;
                var videoOptions = { part: 'statistics, snippet', id: videoID };

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

            return playlistItems.sort(function(v1, v2) {
                return v1.snippet.publishedAt > v2.snippet.publishedAt ? 1 : -1;
            });;
        });
    };

    /**
     * Returns a promise that returns all of the items for a given request.
     */
    ytpa.query.allitems = function(requestFunction, requestOptions, _results) {
        if(!("maxResults" in requestOptions))
            throw TypeError("Request options must define 'maxResults' field.");

        var _results = (_results !== undefined) ? _results : [];
        var numResultsRemaining = requestOptions.maxResults - ytpa.query.MAXRESULTS;
        requestOptions.maxResults = Math.min(ytpa.query.MAXRESULTS, requestOptions.maxResults);

        if(requestOptions.maxResults <= 0) {
            return _results;
        } else {
            var ytRequest = requestFunction( requestOptions );
            return ytRequest.then(function(response) {
                var nextRequestResults = _results.concat(response.result.items);
                var nextRequestOptions = jQuery.extend(true, {}, requestOptions);
                nextRequestOptions.maxResults = numResultsRemaining;
                nextRequestOptions.pageToken = response.result.nextPageToken;

                return ytpa.query.allitems(requestFunction, nextRequestOptions, nextRequestResults);
            });
        }
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
