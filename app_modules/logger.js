class Logger {

    log(message) {
        console.log('Log: ' + message);
    }

    error(message) {
        console.log('Error: ' + message);   
    }

    redisError(message) {
        console.log('Redis Error: ' + message);
    }
}


class DBLogger extends Logger {
    /*
     * DB logger class.
     * Collection of helper functions for db error logging.
     */

    _logError(action, model, func) {
        console.log('DB ' + action  +  ' error >> ' + model + ':' + func + '()');
    }

    insertError(model, func) {
        this._logError('INSERT', model, func);
    }

    selectError(model, func) {
        this._logError('SELECT', model, func);
    }

    updateError(model, func) {
        this._logError('UPDATE', model, func);
    }

    deleteError(model, func) {
        this._logError('DELETE', model, func);
    }

}


exports.Logger = Logger;
exports.DBLogger = DBLogger;


