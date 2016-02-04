/**
 * @file reddit
 *
 * Temp Description
 */

( function(ytpa, $, undefined) {
    /// Public Members ///
    ytpa.reddit = ytpa.reddit || {};

    var reddit_url = "https://www.reddit.com";
    var youtube_url = "https://www.youtube.com"

    ytpa.reddit.getTopCommentForLink = function(videoId, channel) {
        var video_url = youtube_url + "/watch?v=" + videoId;

        return reddit.search(video_url).t('all').limit(10).sort("top").fetch(function(res) {
            for (var idx in res.data.children) {
                var subreddit = res.data.children[idx].data.subreddit;

                if (subreddit.toLowerCase() == channel.toLowerCase()) {
                    var id = res.data.children[idx].data.id;
                    return ytpa.reddit.topComment(id, subreddit);
                }
            }
            return 5;
        });
    };

    ytpa.reddit.topComment = function(id, subreddit) {
        return reddit.comments(id, subreddit).limit(1).sort("top").fetch(function(res) {
            return reddit_url + res[0].data.children[0].data.permalink;
        });
    }

    ytpa.reddit.test = function() {
        return reddit.new('programming').before("t3_23jf8n");
    }
 
}(window.ytpa = window.ytpa || {}, jQuery) );
