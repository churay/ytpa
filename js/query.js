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
     * Creates a request to retrieve the uploads for a given user.
     */
    ytpa.query.requestUploads = function(user, numResults) {
        var requestOptions = {
            part: 'contentDetails',
            forUsername: user,
        };

        var request = gapi.client.youtube.channels.list(requestOptions);

        request.execute(function(response) {
            var userUploadsID = response.result.items[0].contentDetails.relatedPlaylists.uploads;
            ytpa.query.requestPlaylist(userUploadsID, numResults);
        });
    }


    /**
     * Creates a request to retrieve the videos in the given playlist.
     */
    ytpa.query.requestPlaylist = function(playlistID, numResults) {
        var requestOptions = {
            part: 'contentDetails',
            playlistId: playlistID,
            maxResults: numResults,
        };

        var request = gapi.client.youtube.playlistItems.list(requestOptions);

        request.execute(function(response) {
            var playlistItems = response.result.items;
            for (var videoIdx = 0; videoIdx < playlistItems.length; ++videoIdx) {
                var videoId = playlistItems[videoIdx].contentDetails.videoId;
                ytpa.query.requestVideoInfo(videoId);
            }
        });
    }

    /**
     * Creates a request to retrieve the information for a given video.
     */
    ytpa.query.requestVideoInfo = function(videoID) {
        var requestOptions = {
            part: 'snippet',
            id: videoID,
        };

        var request = gapi.client.youtube.videos.list(requestOptions);

        request.execute(function(response) {
            var title = response.result.items[0].snippet.title;
            console.log(title);
        });
    }

}(window.ytpa = window.ytpa || {}, jQuery) );
