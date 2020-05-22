// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

String.prototype.getLinefromCount = function(start) {
	// 文字数から行数を取得
    var NotLF = /(\r\n|\r)/g;
    var region_byCaret = this.slice(0, start);
    var CRLFs = region_byCaret.match(NotLF);
    if (CRLFs) {
        region_byCaret = region_byCaret.replace(NotLF, '\n');
    }
    var lines = region_byCaret.split('\n');
    return lines.length;
};

(function($) {
    var caretPos = function(pos) {
        var item = this.get(0);
        if (pos == null) {
            return get(item);
        } else {
            set(item, pos);
            return this;
        }
    };

    var get = function(item) {
        var CaretPos = 0;
        if (item.selectionStart || item.selectionStart == "0") { // Firefox, Chrome
            start = item.selectionStart;
        } else if (document.selection) { // IE
             start = getSelectionCount(item)[0];
        }
        
        if (isNaN (start)){
            return;
        }
        
        return item.value.getLinefromCount( start );
    };
    var set = function(item, pos) {
        if (item.setSelectionRange) {  // Firefox, Chrome
            item.setSelectionRange(pos, pos);
            
            var lineNum = item.value.getLinefromCount( pos );
            //var lineHeight = item.style.lineHeight.slice(0,-2);
            var lineHeight = Math.round(parseFloat($(item).css("line-height"))); // TODO IE未対応
            item.scrollTop = (lineNum-1) * lineHeight - ($(item).height() / 2);
            item.focus();
        } else if (item.createTextRange) { // IE
            var range = item.createTextRange();
            range.collapse(true);
            range.moveEnd("character", pos);
            range.moveStart("character", pos);
            range.select();
        }
    };
    
    $.fn.extend({caretPos: caretPos});
})(jQuery);

function getSelectionCount(textarea) {
    var selectionRange = textarea.document.selection.createRange();

    if (selectionRange == null || selectionRange.parentElement() !== textarea) {
        return [ NaN, NaN ];
    }

    var value = arguments[1] || textarea.value;
    var valueCount = value.length;
    var range = textarea.createTextRange();
    range.moveToBookmark(selectionRange.getBookmark());

    var endBoundary = textarea.createTextRange();
    endBoundary.collapse(false);

    // endBoundary << range
    if (range.compareEndPoints('StartToEnd', endBoundary) >= 0) {
        return [ valueCount, valueCount ];
    }

    var normalizedValue = arguments[2] || value.replace(/rn|r/g, 'n');
    var start = -(range.moveStart('character', -valueCount));
    start += normalizedValue.slice(0, start).split('n').length - 1;

    // range << endBoundary << range
    if (range.compareEndPoints('EndToEnd', endBoundary) >= 0) {
        return [ start, valueCount ];
    }

    // range << endBoundary
    var end = -(range.moveEnd('character', -valueCount));
    end += normalizedValue.slice(0, end).split('n').length - 1;
    return [ start, end ];
}
