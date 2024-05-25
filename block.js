(function (blocks, editor, element, components, i18n) {
    var el = element.createElement;
    var InspectorControls = editor.InspectorControls;
    var CheckboxControl = components.CheckboxControl;
    var TextControl = components.TextControl;
    var PanelBody = components.PanelBody;
    var __ = i18n.__ || wp.i18n.__;

    var registerBlockType = blocks.registerBlockType;

    registerBlockType('advanced-ajax-search/block', {
        title: __('Advanced Ajax Search', 'advanced-ajax-search'),
        icon: 'search',
        category: 'widgets',
        attributes: {
            icon: {
                type: 'string',
                default: '🔍'
            },
            height: {
                type: 'string',
                default: '40px'
            },
            query: {
                type: 'string',
                default: ''
            },
            searchOptions: {
                type: 'object',
                default: {
                    posts: true,
                    taxonomies: false,
                    pages: false,
                    products: false
                }
            }
        },
        edit: function (props) {
            var attributes = props.attributes;
            var setAttributes = props.setAttributes;

            function onChangeIcon(newIcon) {
                setAttributes({ icon: newIcon });
            }

            function onChangeHeight(newHeight) {
                setAttributes({ height: newHeight });
            }

            function onChangeSearchOptions(newOptions) {
                setAttributes({ searchOptions: newOptions });
            }

            var timer;
            function onQueryChange(event) {
                clearTimeout(timer);
                var searchQuery = event.target.value;
                setAttributes({ query: searchQuery });
                timer = setTimeout(function () {
                    performSearch(searchQuery);
                }, 500);
            }

            function performSearch(searchQuery) {
                var searchOptions = attributes.searchOptions;
                var searchData = {
                    query: searchQuery,
                    search_options: searchOptions,
                    nonce: ajax_search_params.nonce
                };

                fetch(ajax_search_params.ajax_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    body: 'action=advanced_ajax_search&nonce=' + encodeURIComponent(searchData.nonce) +
                        '&query=' + encodeURIComponent(searchData.query) +
                        '&search_options=' + encodeURIComponent(JSON.stringify(searchData.search_options))
                })
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (data) {
                        var searchResultsContainer = document.querySelector('.advanced-ajax-search-results');
                        if (data.success && data.data) {
                            searchResultsContainer.innerHTML = '';
                            data.data.forEach(function (result) {
                                var div = document.createElement('div');
                                div.className = 'search-result';
                                div.innerHTML = '<a href="' + result.link + '">' + result.title + '</a>';
                                searchResultsContainer.appendChild(div);
                            });
                        } else {
                            searchResultsContainer.innerHTML = 'No results found.';
                        }
                    })
                    .catch(function (error) {
                        console.error('An error occurred while processing your request:', error);
                        var searchResultsContainer = document.querySelector('.advanced-ajax-search-results');
                        searchResultsContainer.innerHTML = 'An error occurred while processing your request.';
                    });
            }

            return [
                el(InspectorControls, { key: 'inspector' },
                    el(PanelBody, { title: __('Settings', 'advanced-ajax-search'), initialOpen: true },
                        el(TextControl, {
                            label: __('Search Icon', 'advanced-ajax-search'),
                            value: attributes.icon,
                            onChange: onChangeIcon
                        }),
                        el(TextControl, {
                            label: __('Search Bar Height (ex. 40px)', 'advanced-ajax-search'),
                            value: attributes.height,
                            onChange: onChangeHeight
                        }),
                        el('h3', {}, __('Search Options')),
                        el(CheckboxControl, {
                            label: __('Posts', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.posts,
                            onChange: function (value) { onChangeSearchOptions({ ...attributes.searchOptions, posts: value }) }
                        }),
                        el(CheckboxControl, {
                            label: __('Taxonomies', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.taxonomies,
                            onChange: function (value) { onChangeSearchOptions({ ...attributes.searchOptions, taxonomies: value }) }
                        }),
                        el(CheckboxControl, {
                            label: __('Pages', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.pages,
                            onChange: function (value) { onChangeSearchOptions({ ...attributes.searchOptions, pages: value }) }
                        }),
                        el(CheckboxControl, {
                            label: __('Products', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.products,
                            onChange: function (value) { onChangeSearchOptions({ ...attributes.searchOptions, products: value }) }
                        })
                    )
                ),
                el('div', {
                    className: 'advanced-ajax-search-block',
                    'data-search-options': JSON.stringify(attributes.searchOptions),
                    'data-icon': attributes.icon
                },
                    el('div', {
                        style: { height: attributes.height, display: 'flex', alignItems: 'center', border: '1px solid #ddd', padding: '5px' }
                    },
                        el('span', { style: { marginRight: '10px' } }, attributes.icon),
                        el('input', {
                            type: 'text',
                            value: attributes.query,
                            placeholder: __('Search...', 'advanced-ajax-search'),
                            style: { flex: '1', height: '100%' },
                            onInput: onQueryChange
                        })
                    ),
                    el('div', { className: 'advanced-ajax-search-results' })
                )
            ];
        },
        save: function (props) {
            var attributes = props.attributes;
            return el('div', {
                className: 'advanced-ajax-search-block',
                'data-search-options': JSON.stringify(attributes.searchOptions),
                'data-icon': attributes.icon
            },
                el('div', {
                    style: { height: attributes.height, display: 'flex', alignItems: 'center', border: '1px solid #ddd', padding: '5px' }
                },
                    el('span', { style: { marginRight: '10px' } }, attributes.icon),
                    el('input', {
                        type: 'text',
                        value: attributes.query,
                        placeholder: __('Search...', 'advanced-ajax-search'),
                        style: { flex: '1', height: '100%' }
                    })
                ),
                el('div', { className: 'advanced-ajax-search-results' })
            );
        }
    });
})(window.wp.blocks, window.wp.editor, window.wp.element, window.wp.components, window.wp.i18n);
