/**
 * @file reddit
 *
 * A library script that contains all of the functions associated with querying
 * the Reddit API for thread and comment data.
 */

// TODO(JRC): Move the functionality in this module to the "query.js" module
// and create two submodules: "ytpa.query.youtube" and "ytpa.query.reddit".

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.reddit = ytpa.reddit || {};

    /**
     * Returns the top comment in the most related Reddit thread for the
     * given channel's video.
     */
    ytpa.reddit.topcomment = function(videoID, channel) {
        var videoURL = `https://www.youtube.com/watch?v=${videoID}`;

        return reddit.search(videoURL).t('all').limit(10).sort('top').fetch(
        ).then(function(response) {
            var bestThread = response.data.children[0];
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
            return response[1].data.children[0].data.body;
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
