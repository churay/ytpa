/**
 * @file templates.js
 *
 * An auxiliary script that contains all of the template strings used in the
 * "ytpa" tool.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    ytpa.templates = ytpa.templates || {};

    /** The string template for formal reddit comment displays. */
    ytpa.templates.redditcomment = `
        <div class="frame">
            <div class="embed">
                <div class="embed-content">
                    <ol class="embed-list">
                        <li class="embed-list-item">
                            <article class="embed-comment ">
                                <header class="embed-comment-header"><span class="embed-author">{0}</span>
                                    <div class="embed-comment-meta">{1}</a>
                                        <a href="" data-redirect-type="timestamp" >
                                            <time class="live-timestamp">{2}</time>
                                        </a>
                                    </div>
                                </header>
                                <blockquote class="embed-comment-body">
                                    <div class="md">
                                        <p>{3}</p>
                                    </div>
                            </article>
                        </li>
                    </ol>
                </div>
                <footer class="embed-footer" role="contentinfo">
                    <p>From <a href="{4}">{5}</a> on <a href="{6}">{7}</a></p>
                </footer>
            </div>
        </div>`;

}(window.ytpa = window.ytpa || {}, jQuery) );
