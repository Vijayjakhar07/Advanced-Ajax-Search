document.addEventListener('DOMContentLoaded', function () {
    var searchBlocks = document.querySelectorAll('.advanced-ajax-search-block');

    searchBlocks.forEach(function (block) {
        var input = block.querySelector('input');
        var resultsContainer = block.querySelector('.advanced-ajax-search-results');
        var searchOptions = JSON.parse(block.getAttribute('data-search-options'));
        var nonce = ajax_search_params.nonce;

        var debounceTimeout;

        input.addEventListener('input', function (event) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(function () {
                performSearch(event.target.value);
            }, 300);
        });

        function performSearch(searchQuery) {
            var searchData = {
                query: searchQuery,
                search_options: searchOptions,
                nonce: nonce
            };

            var xhr = new XMLHttpRequest();
            xhr.open('POST', ajax_search_params.ajax_url, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success && response.data) {
                        resultsContainer.innerHTML = '';
                        response.data.forEach(function (result) {
                            var div = document.createElement('div');
                            div.className = 'search-result';
                            div.innerHTML = '<a href="' + result.link + '">' + result.title + '</a>';
                            resultsContainer.appendChild(div);
                        });
                    } else {
                        resultsContainer.innerHTML = 'No results found.';
                    }
                }
            };
            xhr.send('action=advanced_ajax_search&nonce=' + searchData.nonce + '&query=' + encodeURIComponent(searchData.query) + '&search_options=' + encodeURIComponent(JSON.stringify(searchData.search_options)));
        }
    });
});
