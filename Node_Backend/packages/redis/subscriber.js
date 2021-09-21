const redis = require("redis");
const mailService = require("../mailService");
let host;
let port;
let subscriber;
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
        subscriber = redis.createClient(port, host, {
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
        if (subscriber.connected && subscriber.ready) {
            subscriber.subscribe("emailNotification");
        } else {
            console.log('Redis connection failed');
        }
    }
    catch (err) {
        console.log('Error occured while creating redis subscriber');
    }
})();

if (subscriber.connected && subscriber.ready) {
    subscriber.on("message", function (channel, message) {
        switch (channel) {
            case 'emailNotification': emailNotificationProcess(JSON.parse(message)); break;
            default: break;
        }
    });
}

emailNotificationProcess = (message) => {
    mailService.sendMailSMTP(message.email, message.template, message.params);
}


