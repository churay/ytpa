/**
 * @file query.js
 *
 * A library script that contains all of the functionality associated with
 * querying the YouTube and Reddit APIs for video metadata and analytics.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.query = ytpa.query || {};
    ytpa.query.youtube = ytpa.query.youtube || {};
    ytpa.query.reddit = ytpa.query.reddit || {};

    /** An object containing all of the option enumerations for plotting. **/
    ytpa.query.opts = {};
    /** An enumeration of all of the graph representation types. **/
    ytpa.query.opts.search = Object.freeze({NAME: 0, ID: 1,
        props: {0: {name: 'Channel Name', value: 0}, 1: {name: 'Channel ID', value: 1}}});

    // YouTube Query Functions //

    /**
     * Returns a promise that returns all of the playlist objects for a given user.
     */
    ytpa.query.youtube.playlists = function(user, searchType, numResults) {
        var uidRequestOptions = {
            part: 'id',
            id: (searchType == ytpa.query.opts.search.ID) ? user : undefined,
            forUsername: (searchType == ytpa.query.opts.search.NAME) ? user : undefined,
        };

        var uidRequest = gapi.client.youtube.channels.list(uidRequestOptions);
        return uidRequest.then(function(response) {
            var channelID = response.result.items[0].id;
            var plidRequestOptions = {
                part: 'id',
                channelId: channelID,
            };

            return ytpa.query.youtube.items( gapi.client.youtube.playlists.list,
                plidRequestOptions, numResults );

        }, function(error) {
            console.log(error.body);
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
    ytpa.query.youtube.uploads = function(user, numResults) {
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

            return ytpa.query.youtube.items( gapi.client.youtube.playlistItems.list,
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
    ytpa.query.youtube.playlistvideos = function(playlistID) {
        var requestOptions = {
            part: 'contentDetails',
            playlistId: playlistID,
        };

        return ytpa.query.youtube.items(gapi.client.youtube.playlistItems.list,
            requestOptions ).then(function(response) {
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
                return (v1.snippet.publishedAt > v2.snippet.publishedAt) ? 1 : -1;
            });
        });
    };

    /**
     * Returns a promise that contains the top comment object for the given video.
     */
    ytpa.query.youtube.topcomment = function(videoID, channel) {
        var requestOptions = {
            part: 'snippet',
            videoId: videoID,
            maxItems: 1,
            order: 'relevance',
            textFormat: 'plainText',
        };

        var commentRequest = gapi.client.youtube.commentThreads.list(requestOptions);
        return commentRequest.then(function(response) {
            if(response == undefined || response.result == undefined || response.result.items.length == 0)
                return undefined;

            return response.result.items[0].snippet;

        }, function(error) {
            console.log(error.body);
            return undefined;
        });
    };

    /**
     * Returns a promise that returns the items for a given request.
     */
    ytpa.query.youtube.items = function(requestFunction, requestOptions, numResults, _results) {
        var numResults = (numResults !== undefined) ? numResults : Number.POSITIVE_INFINITY;
        var _results = (_results !== undefined) ? _results : [];

        if(_results.length >= numResults) {
            return _results.slice(0, numResults);
        } else {
            requestOptions.maxResults = 50;
            return requestFunction(requestOptions).then(function(response) {
                var nextRequestOptions = jQuery.extend(true, {}, requestOptions);
                nextRequestOptions.pageToken = response.result.nextPageToken;

                var nextRequestResults = _results.concat(response.result.items);
                var nextNumResults = Math.min(numResults,
                    response.result.pageInfo.totalResults);

                return ytpa.query.youtube.items(requestFunction, nextRequestOptions,
                    nextNumResults, nextRequestResults);
            });
        }
    };

    // Reddit Query Functions //

    /**
     * Returns the top comment in the most related Reddit thread for the
     * given channel's video.
     */
    ytpa.query.reddit.topcomment = function(videoID, channel) {
        // TODO(JRC): On Reddit, it was once possible to search for just the
        // URL of a YouTube video to find associated results (e.g.
        // url:youtube.com/watch?v=...), but now it requires extracting the ID
        // from the YouTube prefix and using the 'site' modifier instead.
        var videoURL = `site:www.youtube.com AND url:v=${videoID}`;

        return reddit.search(videoURL).t('all').limit(10).sort('top').fetch(
        ).then(function(response) {
            if(response == undefined || response.data.children.length == 0)
                return undefined;

            var bestThread = response.data.children[0].data;
            for(var threadIdx in response.data.children) {
                var thread = response.data.children[threadIdx].data;

                if(thread.subreddit.toLowerCase() == channel.toLowerCase()) {
                    bestThread = thread;
                    break;
                }
            }

            return reddit.comments(bestThread.id,
                bestThread.subreddit).limit(1).sort('top').fetch();

        }).then(function(response) {
            if(response == undefined || response.length == 0 || response[1].data.children.length == 0)
                return undefined;

            return {
                thread: response[0].data.children[0].data,
                comment: response[1].data.children[0].data,
            };
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
