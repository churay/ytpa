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
            for(var idx in response.data.children) {
                var subreddit = response.data.children[idx].data.subreddit;

                if(subreddit.toLowerCase() == channel.toLowerCase())
                    return {
                        comment: response.data.children[idx].data.id,
                        subreddit: response.data.children[idx].data.subreddit,
                    };
            }

            return { comment: -1, subreddit: '' };

        }).then(function(response) {
            return reddit.comments(response.comment, response.subreddit).limit(1).sort('top').fetch();
        });
    };

    // TODO(JRC): Remove this function once testing for the Reddit API is finished.
    ytpa.reddit.test = function() {
        reddit.new('programming').limit(10).fetch().then(function(response) {
            console.log(response);
        });
    };

}(window.ytpa = window.ytpa || {}, jQuery) );
