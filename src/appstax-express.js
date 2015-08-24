
var appstax = require("appstax");
var extend  = require("extend");
var createDomain = require("domain").create;

var config = {};
var context = {};

function createContext(options) {
    var ctx = appstax.app(config);
    ctx.sessionId(getSessionId);
    return ctx;
}

function getSessionId() {
    var sessionId = "";
    var domain = process.domain;
    if(domain != null && typeof domain.__appstax == "object") {
        sessionId = domain.__appstax.sessionId;
    }
    return sessionId;
}

context.init = function(options) {
    if(typeof options === "string") {
        options = { appKey: options };
    }
    config = extend({}, config, options);

    var ctx = createContext(options)
    
    Object.keys(ctx).forEach(function bridgeApi(key) {
        if(!context.hasOwnProperty(key)) {
            Object.defineProperty(context, key, { get: function() {
                var domain = process.domain;
                if(domain != null && typeof domain.__appstax == "object") {
                    return domain.__appstax.context[key];
                }
                return null
            }});
        }
    });
}

context.sessions = function() {
    return function(req, res, next) {
        var domain = createDomain();
        domain.add(req);
        domain.add(res);
        domain.__appstax = {}

        var sessionId = req.get("x-appstax-sessionid");
        domain.__appstax.sessionId = sessionId;
        domain.__appstax.context = createContext(config);

        domain.run(function() {
            next();
        });
        domain.on("error", function(e) {
            next(e);
        });
    }
}

module.exports = context;
