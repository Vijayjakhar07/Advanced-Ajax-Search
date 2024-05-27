<?php
/**
 * Plugin Name: Advanced Ajax Search
 * Description: A custom Gutenberg block for Ajax search.
 * Version: 1.0
 * Author: Mohammad Zaid
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Enqueue block editor assets
function advanced_ajax_search_enqueue_block_editor_assets()
{
    wp_enqueue_script(
        'advanced-ajax-search-block',
        plugins_url('block.js', __FILE__),
        array('wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n'),
        filemtime(plugin_dir_path(__FILE__) . 'block.js')
    );

    wp_enqueue_style(
        'advanced-ajax-search-editor-style',
        plugins_url('editor.css', __FILE__),
        array('wp-edit-blocks'),
        filemtime(plugin_dir_path(__FILE__) . 'editor.css')
    );

    wp_localize_script(
        'advanced-ajax-search-block',
        'ajax_search_params',
        array(
            'nonce' => wp_create_nonce('wp_rest'),
            'rest_url' => esc_url_raw(rest_url('advanced-ajax-search/v1/search'))
        )
    );
}
add_action('enqueue_block_editor_assets', 'advanced_ajax_search_enqueue_block_editor_assets');

// Enqueue frontend assets
function advanced_ajax_search_enqueue_frontend_assets()
{
    wp_enqueue_script(
        'advanced-ajax-search-frontend',
        plugins_url('frontend.js', __FILE__),
        array('wp-element'),
        filemtime(plugin_dir_path(__FILE__) . 'frontend.js'),
        true
    );

    wp_enqueue_style(
        'advanced-ajax-search-style',
        plugins_url('style.css', __FILE__),
        array(),
        filemtime(plugin_dir_path(__FILE__) . 'style.css')
    );

    wp_localize_script(
        'advanced-ajax-search-frontend',
        'ajax_search_params',
        array(
            'nonce' => wp_create_nonce('wp_rest'),
            'rest_url' => esc_url_raw(rest_url('advanced-ajax-search/v1/search'))
        )
    );
}
add_action('wp_enqueue_scripts', 'advanced_ajax_search_enqueue_frontend_assets');

// Register REST API routes
add_action('rest_api_init', function () {
    register_rest_route('advanced-ajax-search/v1', '/search', array(
        'methods' => 'POST',
        'callback' => 'advanced_ajax_search_rest_callback',
        'permission_callback' => '__return_true'
    ));
});

function advanced_ajax_search_rest_callback(WP_REST_Request $request)
{
    $nonce = $request->get_param('nonce');
    if (!wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_REST_Response('Invalid nonce', 403);
    }

    $query = sanitize_text_field($request->get_param('query'));
    $search_options = $request->get_param('search_options');

    if (empty($query)) {
        return new WP_REST_Response(array(), 200);
    }

    if (is_null($search_options) || !is_array($search_options)) {
        return new WP_REST_Response('Invalid search options format', 400);
    }

    $search_results = array();
    if (!empty($search_options['posts'])) {
        $search_results = array_merge($search_results, fetch_search_results('any', $query));
    }
    if (!empty($search_options['taxonomies'])) {
        $search_results = array_merge($search_results, fetch_taxonomy_results($query));
    }
    if (!empty($search_options['pages'])) {
        $search_results = array_merge($search_results, fetch_search_results('page', $query));
    }
    if (!empty($search_options['products'])) {
        $search_results = array_merge($search_results, fetch_search_results('product', $query));
    }

    if (!empty($search_results)) {
        return new WP_REST_Response($search_results, 200);
    } else {
        return new WP_REST_Response('No results found', 404);
    }
}

// Fetch search results function remains unchanged
function fetch_search_results($post_type, $query)
{
    $post__not_in = [];
    if ($post_type == 'any') {
        $post__not_in = array_merge(get_all_page_ids(), get_all_product_ids());
    }
    $args = array(
        'post_type' => $post_type,
        'post__not_in' => $post__not_in,
        's' => $query
    );
    $query = new WP_Query($args);

    return extract_search_results($query);
}

// Fetch taxonomy results function remains unchanged
function fetch_taxonomy_results($query)
{
    $results = [];
    $taxonomies = get_taxonomies(array(), 'objects');

    foreach ($taxonomies as $taxonomy) {
        $terms = get_terms(array(
            'taxonomy' => $taxonomy->name,
            'name__like' => $query,
            'hide_empty' => false,
        ));

        if ($terms && !is_wp_error($terms)) {
            foreach ($terms as $term) {
                $term_link = get_term_link($term);
                $results[] = array(
                    'title' => esc_html($term->name),
                    'link' => !is_wp_error($term_link) ? esc_url($term_link) : '',
                );
            }
        }
    }
    return $results;
}

// Extract search results function remains unchanged
function extract_search_results($query)
{
    $results = array();
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            $results[] = array(
                'title' => esc_html(get_the_title()),
                'link' => esc_url(get_permalink()),
            );
        }
        wp_reset_postdata();
    }
    return $results;
}

function get_all_product_ids()
{
    $product_ids = array();
    $products = get_posts(
        array(
            'post_type' => 'product',
            'posts_per_page' => -1,
            'fields' => 'ids',
        )
    );
    foreach ($products as $product_id) {
        $product_ids[] = $product_id;
    }
    return $product_ids;
}
