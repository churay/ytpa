/**
 * @file query.js
 *
 * A library script that contains all of the functionality associated with
 * querying the YouTube API for video data and analytics.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.query = ytpa.query || {};
    var results = []; 

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
        var numResults = (numResults !== undefined) ? numResults : 65;
        var uploadsPLID;
        
        var uplRequestOptions = {
            part: 'contentDetails',
            forUsername: user,
        };

        var uplRequest = gapi.client.youtube.channels.list(uplRequestOptions);
        return uplRequest.then(function(response) {
            uploadsPLID = response.result.items[0].contentDetails.relatedPlaylists.uploads;

            return requestAllVideos(numResults, uploadsPLID);
        }).then(function(response) {
            var promises = [];
            var playlistItems = flatten(response);

            for(var videoIdx in playlistItems) {
                var videoID = playlistItems[videoIdx].contentDetails.videoId;
                var videoOptions = { part: 'snippet', id: videoID };

                var videoRequest = gapi.client.youtube.videos.list(videoOptions);
                promises.push(videoRequest);
            }
            return promises;

        }).then(function(response) {
            return Promise.all(response).then(function(promiseArr) {
                var playlistItems = []

                promiseArr.forEach(function(response) {
                    playlistItems.push(response.result.items[0].snippet);
                });
                return playlistItems;
            });
        });
    };

    /**
     * Returns the first remaining results of a playlist
     */
    function requestAllVideos(remaining, ID, nextToken) {
        if (remaining === 0) {
            return results;
        }

        var uplplRequestOptions = {
                part: 'contentDetails',
                playlistId: ID,
                maxResults: 50,
        };
        
        if (remaining < 51) {
            uplplRequestOptions.maxResults = remaining;
            remaining = 0;
        } 
        else
            remaining -= 50;

        
        if (nextToken)
            uplplRequestOptions.pageToken = nextToken;

        var request = gapi.client.youtube.playlistItems.list(uplplRequestOptions);

        return request.then(function(response) {
            var npt = response.result.nextPageToken;
            results.push(response.result.items);

            return requestAllVideos(remaining, ID, npt);
        });
    }

    // Borrowed from stack overflow: http://stackoverflow.com/questions/27266550/how-to-flatten-nested-array-in-javascript
    function flatten(ary) {
        var ret = [];
        for(var i = 0; i < ary.length; i++) {
            if(Array.isArray(ary[i])) {
                ret = ret.concat(flatten(ary[i]));
            } else {
                ret.push(ary[i]);
            }
        }
        return ret;
    }
}(window.ytpa = window.ytpa || {}, jQuery) );
