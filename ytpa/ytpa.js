/**
 * @file ytpa.js
 *
 * The main script for the "ytpa" application, which contains global bootstrapping
 * and configuration logic for the application.
 */

( function(ytpa, $, undefined) {
    /// Public Members ///

    /**
     * The primary initialization function for the "ytpa" library.  This function
     * must be called before calling any other library functions.
     */
    ytpa.init = function() {
        ytpaDocumentWait().then(ytpaDocumentInit).then(function() {
            return gapi.client.init({
                'apiKey': ytpa.config.appid,
                'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
            });
        }).then(ytpa.query.init);
    };

    /// Private Members ///

    /**
     * Returns a promise that yields true when the page in which the application
     * is being rendered is ready.
     *
     * @see https://gist.github.com/josh/8177583
     */
    function ytpaDocumentWait() {
        return new Promise(function(resolve) {
            if(document.readyState == 'complete') {
                resolve();
            } else {
                function onReady() {
                    resolve();
                    document.removeEventListener('DOMContentLoaded', onReady, true);
                    window.removeEventListener('load', onReady, true);
                }

                document.addEventListener('DOMContentLoaded', onReady, true);
                window.addEventListener('load', onReady, true);
            }
        });
    }

    /**
     * Returns a promise that yields true when the application page is initialized.
     */
    function ytpaDocumentInit() {
        // Rendering Helpers //

        var redrawQuotaPanel = function() {
            var quotaNow = ytpa.query.data.ytquota.session;
            var quotaMax = ytpa.query.data.ytquota.maximum;
            var quotaUse = Math.min((quotaNow / quotaMax) * 100.0, 100.0);
            var aboveQuota = quotaNow > quotaMax;

            $('#ytpa-quota-label').html(`Session: ${quotaNow} / ${quotaMax}`);
            $('#ytpa-quota-bar').attr('aria-valuenow', quotaUse);
            $('#ytpa-quota-bar').css('width', `${quotaUse}%`);
            $('#ytpa-quota-bar').html(`${quotaUse}${aboveQuota ? '+' : ''}%`);

            if(aboveQuota && !$('#ytpa-quota-bar').hasClass('progress-bar-danger')) {
                $('#ytpa-quota-bar').addClass('progress-bar-danger');
            }
        };

        var redrawFormPlot = function() {
            ytpa.plot.draw(ytpaGetFormPlotOptions());
        };

        var queryNewChannel = function() {
            ytpaQueryFormChannel().then(ytpa.plot.clear)
                .then(redrawFormPlot).then(redrawQuotaPanel);
        };

        var redrawFormPlotAndOpts = function() {
            redrawFormPlot();

            var isAggSelected = $('#ytpa-graphtype').val() == 2;

            var enabledForm = isAggSelected ? $('#ytpa-group') : $('#ytpa-scale');
            var disabledForm = isAggSelected ? $('#ytpa-scale') : $('#ytpa-group');
            enabledForm.removeAttr('disabled');
            disabledForm.attr('disabled', 'disabled');
            $('.selectpicker').selectpicker('refresh');

            var enabledFormDiv = isAggSelected ? $('#ytpa-group-div') : $('#ytpa-scale-div');
            var disabledFormDiv = isAggSelected ? $('#ytpa-scale-div') : $('#ytpa-group-div');
            enabledFormDiv.show();
            disabledFormDiv.hide();
        };

        // Initialization Logic //

        return new Promise(function(resolve) {
            $('.selectpicker').selectpicker();

            $('#ytpa-channel').keypress(function(e) {
                if(e.which == 13) {
                    var target = $('.spinner-container').get(0);
                    var spinner = new Spinner(ytpa.config.spinner).spin(target);
                    $(document).on('populated', function() { spinner.stop(); });
                    queryNewChannel();
                }
            });

            $('#ytpa-channel-submit').click(function() {
                var target = $('.spinner-container').get(0);
                var spinner = new Spinner(ytpa.config.spinner).spin(target);
                $(document).on('populated', function() { spinner.stop(); });
                queryNewChannel();
            });

            $('#ytpa-playlist').change(function() {
                var playlistObjects = $('#ytpa-playlist option:selected');

                var playlistIDs = playlistObjects.map(function() {
                    return $(this).val(); }).get();
                var playlistNames = playlistObjects.map(function() {
                    return $(this).text(); }).get();

                return ytpa.plot.playlists(playlistNames, playlistIDs, ytpaGetFormPlotOptions())
                    .then(redrawQuotaPanel);
            });

            $('#ytpa-graphtype').change(redrawFormPlotAndOpts);
            $('#ytpa-statistic').change(redrawFormPlot);
            $('#ytpa-scale').change(redrawFormPlot);
            $('#ytpa-group').change(redrawFormPlot);
            $('#ytpa-metastatistic').change(redrawFormPlot);
            $('#ytpa-graph').height($('#ytpa-graph').width());

            redrawFormPlotAndOpts();

            resolve();
        });
    }

    /**
     * Queries the channel information for the channel given in the form and
     * populates the form playlists with this channel's information.
     */
    function ytpaQueryFormChannel() {
        var queryType = $('#ytpa-search').val();
        var channelName = $('#ytpa-channel').val();

        return ytpa.query.youtube.playlists(channelName, queryType).then(function(playlists) {
            playlists.sort(function(p1, p2) {
                return (p1.snippet.title > p2.snippet.title) ? 1 : -1;
            });

            var playlistOptions = $('#ytpa-playlist');
            if(channelName != playlistOptions.attr('data-playlist')) {
                playlistOptions.empty();
                playlistOptions.attr('data-playlist', channelName);

                for(var playlistIdx in playlists) {
                    var playlist = playlists[playlistIdx];
                    var playlistElement = document.createElement('option');

                    playlistElement.setAttribute('value', playlist.id);
                    playlistElement.setAttribute('class', 'ytpa-select-option');
                    playlistElement.setAttribute('title', playlist.snippet.title);
                    playlistElement.innerHTML = playlist.snippet.title;
                    playlistOptions.append(playlistElement);
                }
            }
            $(document).trigger('populated');
            playlistOptions.selectpicker('refresh');

        }, function(error) {
            var queryTypeName = ytpa.query.opts.search.props[parseInt(queryType)].name;
            alert(`Invalid ${queryTypeName} '${channelName}'!`);
            $(document).trigger('populated');
        });
    }

    /**
     * Returns an object defining all of the options for drawing the visualization plot.
     */
    function ytpaGetFormPlotOptions() {
        return {
            type: $('#ytpa-graphtype').val(),
            data: $('#ytpa-statistic').val(),
            meta: $('#ytpa-metastatistic').val(),
            scale: $('#ytpa-scale').val(),
            group: $('#ytpa-group').val(),
        };
    }

}(window.ytpa = window.ytpa || {}, jQuery) );
