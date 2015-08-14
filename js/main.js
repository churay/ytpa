/**
 * @file main.js
 *
 * The main script point for the "ytpa" application, which contains all the
 * bootstrapping logic for the application.
 */

/// Entry Point ///

/**
 * Creates a request to retrieve the uploads playlist id of a user
 */
function makeRequest(username, numResults) {
    var requestOptions = {
        part: 'contentDetails',
        forUsername: username
    };

    var request = gapi.client.youtube.channels.list(requestOptions);

    request.execute(function(response) {
        var userUploadsID = response.result.items[0].contentDetails.relatedPlaylists.uploads;
        requestPlaylist(userUploadsID, numResults);
    });
}


/**
 * Creates a request to retrieve the videos in the uploads playlist
 */
function requestPlaylist(playlistID, numResults) {
    var requestOptions = {
        part: 'contentDetails',
        playlistId: playlistID
    };

    if (numResults) {
        requestOptions.maxResults = numResults;
    }

    var request = gapi.client.youtube.playlistItems.list(requestOptions);

    request.execute(function(response) {
        var playlistItems = response.result.items;
        var l = playlistItems.length;

        for (var i = 0; i < l; i++) {
            var videoId = playlistItems[i].contentDetails.videoId;
            requestVideoInfo(videoId);
        }
    });
}

/**
 * Creates a request to retrieve the video information and prints title to console
 */
function requestVideoInfo(videoId) {
    var requestOptions = {
        part: 'snippet',
        id: videoId
    };

    var request = gapi.client.youtube.videos.list(requestOptions);

    request.execute(function(response) {
        var title = response.result.items[0].snippet.title;
        console.log(title);
    });
}

function main() {
    gapi.client.setApiKey(ytpa.config.appid);
    gapi.client.load('youtube', 'v3', function(){
        makeRequest('GameGrumps', 10);
    });
}
