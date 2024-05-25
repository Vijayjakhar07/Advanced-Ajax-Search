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
            'nonce' => wp_create_nonce('advanced-ajax-search-nonce'),
            'ajax_url' => admin_url('admin-ajax.php')
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
            'nonce' => wp_create_nonce('advanced-ajax-search-nonce'),
            'ajax_url' => admin_url('admin-ajax.php')
        )
    );
}
add_action('wp_enqueue_scripts', 'advanced_ajax_search_enqueue_frontend_assets');

// AJAX handler
add_action('wp_ajax_advanced_ajax_search', 'advanced_ajax_search_callback');
add_action('wp_ajax_nopriv_advanced_ajax_search', 'advanced_ajax_search_callback');

function advanced_ajax_search_callback()
{
    // Check nonce for security
    if (!check_ajax_referer('advanced-ajax-search-nonce', 'nonce', false)) {
        wp_send_json_error('Invalid nonce.');
    }

    // Validate and sanitize input
    $query = isset($_POST['query']) ? sanitize_text_field($_POST['query']) : '';

    // If the query is empty, return an empty result array
    if (empty($query)) {
        wp_send_json_success(array());
    }

    $search_options = isset($_POST['search_options']) ? json_decode(stripslashes($_POST['search_options']), true) : null;

    if (is_null($search_options) || !is_array($search_options)) {
        wp_send_json_error('Invalid search options format.');
    }

    // Fetch search results
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
        wp_send_json_success($search_results);
    } else {
        wp_send_json_error('No results found.');
    }
}

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
function get_all_product_ids()
{
    $product_ids = array();
    $products = get_posts(
        array(
            'post_type' => 'product',
            'posts_per_page' => -1, // Retrieve all products
            'fields' => 'ids', // Only get post IDs
        )
    );
    foreach ($products as $product_id) {
        $product_ids[] = $product_id;
    }
    return $product_ids;
}


function fetch_taxonomy_results($query)
{

    $results = [];
    // Get all taxonomies
    $taxonomies = get_taxonomies(array(), 'objects');


    // Loop through taxonomies
    foreach ($taxonomies as $taxonomy) {

        // Get the terms associated with the current post for this taxonomy
        $terms = get_terms(array(
            'taxonomy' => $taxonomy->name,
            'name__like' => $query,
            'hide_empty' => false,
        ));

        // Check if terms were found
        if ($terms && !is_wp_error($terms)) {
            // Loop through terms and generate permalinks
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
