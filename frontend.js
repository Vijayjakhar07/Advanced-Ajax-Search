document.addEventListener('DOMContentLoaded', function () {
    var searchBlocks = document.querySelectorAll('.advanced-ajax-search-block');

    searchBlocks.forEach(function (block) {
        var input = block.querySelector('input');
        var resultsContainer = block.querySelector('.advanced-ajax-search-results');
        var searchOptions = JSON.parse(block.getAttribute('data-search-options'));
        var nonce = ajax_search_params.nonce;
        var restUrl = ajax_search_params.rest_url;

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

            fetch(restUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                },
                body: JSON.stringify(searchData)
            })
                .then(function (response) {
                return response.json().then(function(data) {
                    return { status: response.status, data: data };
                });
            })
                .then(function (responseAndData) {
                    var responseStatus = responseAndData.status;
                    var data = responseAndData.data;
                    resultsContainer.innerHTML = '';
                    if (data.length && responseStatus===200) {
                        data.forEach(function (result) {
                            var div = document.createElement('div');
                            div.className = 'search-result';
                            div.innerHTML = '<a href="' + result.link + '">' + result.title + '</a>';
                            resultsContainer.appendChild(div);
                        });
                    } else {
                        resultsContainer.innerHTML = 'No results found.';
                    }
                })
                .catch(function (error) {
                    console.error('An error occurred while processing your request:', error);
                    resultsContainer.innerHTML = 'An error occurred while processing your request.';
                });
        }
    });
});
