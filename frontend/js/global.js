var CONFIG = {
    baseUrl: 'http://vchat.nullcannull-dev.net/',
    chatServer: 'http://vhat-socket.nullcannull-dev.net'
};
CONFIG['apiUrl'] = CONFIG.baseUrl + 'api/';

/* APP Controller Class */
function App() {
    this.escapeHTML = function(string) {
        /* undersocre.js escape function  */
        var entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;',
            '/': '&#x2F;'
        };

        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    this._ajax = function(type, func, options) {
        var params = {
            url: CONFIG.apiUrl + func,
            type: type
        };

        if (options['data']) params['data'] = options['data'];
        if (options['before']) params['beforeSend'] = options['before'];

        $.ajax(params).done(function(response) {
            console.log('(' + type + ')api request to: ' + func + '(response: ' + response['state'] +')');

            if (response['state'] == '200') {
                if (options['success']) options['success'](response.response);
            } else {
                console.log('API request rejected due to an error.');
                if (options['error']) options['error'](response.response);
            }
        });
    };

    this.get = function(func, options) {
        this._ajax('GET', func, options);
    };

    this.post = function(func, options) {
        this._ajax('POST', func, options);
    };

    this.put =  function(func, options) {
        this._ajax('PUT', func, options);
    };

    this.remove = function(func, options) {
        this._ajax('DELETE', func, options);
    };

    this.redirect = function(url) {
        if (typeof url === 'undefined') {
            windows.location.href = CONFIG.baseUrl;
        } else {
            windows.location.href = CONFIG.baseUrl + url;
        }
    };
}

var app = new App();


