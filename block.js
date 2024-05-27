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
                    posts: false,
                    taxonomies: false,
                    pages: false,
                    products: false
                }
            }
        },
        edit: function (props) {
            var attributes = props.attributes;
            var setAttributes = props.setAttributes;

            return [
                el(
                    'div',
                    { className: 'advanced-ajax-search-block', 'data-search-options': JSON.stringify(attributes.searchOptions) },
                    el('input', {
                        type: 'text',
                        value: attributes.query,
                        onChange: function (event) {
                            setAttributes({ query: event.target.value });
                        },
                        placeholder: __('Search...', 'advanced-ajax-search'),
                    }),
                    el('div', { className: 'advanced-ajax-search-results' })
                ),
                el(
                    InspectorControls,
                    { key: 'inspector' },
                    el(
                        PanelBody,
                        { title: __('Settings', 'advanced-ajax-search'), initialOpen: true },
                        el(TextControl, {
                            label: __('Icon', 'advanced-ajax-search'),
                            value: attributes.icon,
                            onChange: function (newIcon) {
                                setAttributes({ icon: newIcon });
                            },
                        }),
                        el(TextControl, {
                            label: __('Height', 'advanced-ajax-search'),
                            value: attributes.height,
                            onChange: function (newHeight) {
                                setAttributes({ height: newHeight });
                            },
                        }),
                        el(CheckboxControl, {
                            label: __('Search Posts', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.posts,
                            onChange: function (checked) {
                                setAttributes({ searchOptions: Object.assign({}, attributes.searchOptions, { posts: checked }) });
                            },
                        }),
                        el(CheckboxControl, {
                            label: __('Search Taxonomies', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.taxonomies,
                            onChange: function (checked) {
                                setAttributes({ searchOptions: Object.assign({}, attributes.searchOptions, { taxonomies: checked }) });
                            },
                        }),
                        el(CheckboxControl, {
                            label: __('Search Pages', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.pages,
                            onChange: function (checked) {
                                setAttributes({ searchOptions: Object.assign({}, attributes.searchOptions, { pages: checked }) });
                            },
                        }),
                        el(CheckboxControl, {
                            label: __('Search Products', 'advanced-ajax-search'),
                            checked: attributes.searchOptions.products,
                            onChange: function (checked) {
                                setAttributes({ searchOptions: Object.assign({}, attributes.searchOptions, { products: checked }) });
                            },
                        })
                    )
                )
            ];
        },
        save: function () {
            return null; // Rendered in PHP
        }
    });
})(window.wp.blocks, window.wp.editor, window.wp.element, window.wp.components, window.wp.i18n);
