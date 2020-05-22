/**
 * Browser detection for jQuery 1.9
 */
(function ($) {
    var ua = navigator.userAgent.toLowerCase(),
        match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [],
        browser = match[1] || "",
        version =  match[2] || "0";
 
    jQuery.browser = {};
 
    if (browser) {
        jQuery.browser[browser] = true;
        jQuery.browser.version = version;
    }
 
    // Chrome is Webkit, but Webkit is also Safari.
    if (jQuery.browser.chrome) {
        jQuery.browser.webkit = true;
    } else if (jQuery.browser.webkit) {
        jQuery.browser.safari = true;
    }
})(jQuery);