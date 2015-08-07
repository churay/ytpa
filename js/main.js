/**
 * @file main.js
 *
 * The main script point for the "ytpa" application, which contains all the
 * bootstrapping logic for the application.
 */

/// Entry Point ///

var API_KEY = 'YourAPIkey'

googleApiClientReady = function() {

	gapi.client.setApiKey(API_KEY);
	gapi.client.load('youtube', 'v3', function(){
		makeRequest('GameGrumps', 10);
	});}


/**
 * Creates a request to retrieve the uploads playlist id of a user
 * @param {string} username The YouTube channel username of desired playlist
 * @param {string} numResults The number of results(videos) we want from a playlist
 * 
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
 * @param {string} playlistID The Id of the playlist 
 * @param {string} numResults The number of results(videos) we want from a playlist
 * 
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
 * @param {string} videoId The Id of the video 
 * 
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
    // TODO(JRC): Implement this function so that the page document is filled
    // with the names of the 10 most recent uploads from some YouTube channel.

    console.log( "Hello, world!" );
}

$( document ).ready( main );
