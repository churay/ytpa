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
        var numResults = (numResults !== undefined) ? numResults : 51;
        var uploadsPLID;
        var results = []
        var uplRequestOptions = {
            part: 'contentDetails',
            forUsername: user,
        };

        var uplRequest = gapi.client.youtube.channels.list(uplRequestOptions);
        return uplRequest.then(function(response) {
            uploadsPLID = response.result.items[0].contentDetails.relatedPlaylists.uploads;

            var uplplRequestOptions = {
                part: 'contentDetails',
                playlistId: uploadsPLID,
                maxResults: 50,
            };

            if (numResults < 51)
                uplplRequestOptions.maxResults = numResults;


            var uplplRequest = gapi.client.youtube.playlistItems.list(uplplRequestOptions);
            return uplplRequest; // returns a promise for the first numResults items

        }).then(function(response) {
            // this "then" clause will handle the logic for numResults > 50
            var count = response.result.items.length;
            var promises = [];

            if (count == numResults) { // add response to array then return it - for numResults less than 51
                promises.push(response);
                return promises;
            }

            var remaining = numResults - count;

            while (response.result.nextPageToken && remaining != 0) {
                var uplplRequestOptions = {
                part: 'contentDetails',
                playlistId: uploadsPLID,
                nextPageToken : response.result.nextPageToken
                };

                if (remaining < 50) {
                    uplplRequestOptions.maxResults = remaining;
                    remaining = 0;
                }
                else {
                    uplplRequestOptions.maxResults = 50;
                    remaining -= 50;
                }
                var request = gapi.client.youtube.playlistItems.list(uplplRequestOptions);
                promises.push(request);
            }

            return promises.concat(response); // need to combine the first numResults itmes with the rest
        }).then(function(promises) {

            return Promise.all(promises).then(function(promiseArr) {
                var playlistBatchRequest = [];

                promiseArr.forEach(function(response) { 
                var playlistItems = response.result.items;

                for(var videoIdx in playlistItems) {
                    var videoID = playlistItems[videoIdx].contentDetails.videoId;
                    var videoOptions = { part: 'snippet', id: videoID };

                    var videoRequest = gapi.client.youtube.videos.list(videoOptions);
                    playlistBatchRequest.push(videoRequest);
                }
            });
                return playlistBatchRequest;

        }).then(function(response) {
                return Promise.all(response).then(function(promiseArr) {
                    var playlistItems = []

                    promiseArr.forEach(function(response) {
                        playlistItems.push(response.result.items[0].snippet);
                    });
                return playlistItems;
                });
            });
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
