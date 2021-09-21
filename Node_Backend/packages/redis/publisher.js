const redis = require("redis");
let host;
let port;
let publisher;
switch (process.env.NODE_APP_STAGE) {
    case 'production':
        host = 'localhost';
        port = 6379;
        break;
    case 'staging':
        host = 'localhost';
        port = 6379;
        break;
    default:
        host = 'localhost';
        port = 6379;
        break;
}

(async () => {
    try {
        publisher = redis.createClient(port, host, {
            retry_strategy: function (options) {
                if (options.error && options.error.code === "ECONNREFUSED") {
                    // End reconnecting on a specific error and flush all commands with
                    // a individual error
                    return new Error("The server refused the connection");
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    // End reconnecting after a specific timeout and flush all commands
                    // with a individual error
                    return new Error("Retry time exhausted");
                }
                if (options.attempt > 10) {
                    // End reconnecting with built in error
                    return undefined;
                }
                // reconnect after
                return Math.min(options.attempt * 100, 3000);
            },
        });
    }
    catch (err) {
        console.log('Error occured while creating redis publisher');
    }
})();

exports.publishMessage = (channel, message) => {
    if (publisher.connected && publisher.ready) {
        publisher.publish(channel, message, function () {
            return true;
        });
    } else return false;
}

