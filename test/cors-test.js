require("mocha");
var expect  = require("chai").expect;
var http    = require("http");
var unirest = require("unirest");
var express = require("express");
var appstax = require("../src/appstax-express");

describe("cors middleware", function() {

    var server;
    var app;

    beforeEach(function() {
        app = express();
        appstax.init({appKey: "my-app-key", baseUrl: "http://example.com/"});
        server = http.createServer(app).listen(5678);
    });

    afterEach(function(done) {
        server.close(done);
    });

    it("should allow all origins when there is no options given", function(done) {
        app.use(appstax.cors());

        unirest("options", "http://localhost:5678/")
            .end(function(res) { 
                var allowOrigin = res.headers["access-control-allow-origin"];
                expect(allowOrigin).to.equal("*");
                done();
            });
    });

    it("should allow given cors origin", function(done) {
        app.use(appstax.cors("http://mydomain.appstax.io"));

        unirest("options", "http://localhost:5678/")
            .end(function(res) { 
                var allowOrigin = res.headers["access-control-allow-origin"];
                expect(allowOrigin).to.equal("http://mydomain.appstax.io");
                done();
            });
    });

    it("should allow appstax headers", function(done) {
        app.use(appstax.cors());

        unirest("options", "http://localhost:5678/")
            .end(function(res) { 
                var allowHeaders = res.headers["access-control-allow-headers"];
                expect(allowHeaders).to.contain("x-appstax-appkey");
                expect(allowHeaders).to.contain("x-appstax-sessionid");
                expect(allowHeaders).to.contain("x-appstax-urltoken");
                expect(allowHeaders).to.contain("content-type");
                expect(allowHeaders).to.contain("if-modified-since");
                done();
            });
    })
});
