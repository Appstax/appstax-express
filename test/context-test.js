require("mocha");
var expect  = require("chai").expect;
var nock    = require("nock");
var http    = require("http");
var unirest = require("unirest");
var express = require("express");
var appstax = require("../src/appstax-express");

describe("contexts", function() {

    var server;
    var app;

    beforeEach(function() {
        app = express();
        appstax.init({appKey: "my-app-key", baseUrl: "http://example.com/"});
        app.use(appstax.sessions());
        server = http.createServer(app).listen(5678);
    });

    afterEach(function(done) {
        nock.cleanAll();
        server.close(done);
    });

    it("should have a global context", function() {
        expect(typeof appstax.object).to.equal("function");
        expect(typeof appstax.findAll).to.equal("function");
        expect(typeof appstax.signup).to.equal("function");
        expect(typeof appstax.sessionId).to.equal("function");
        expect(typeof appstax.file).to.equal("function");
    });

    it("should setup new appstax app context for each request", function(done) {
        var objects = [];
        var statuses = [];

        app.get("/", function(req, res) {
            setTimeout(function() { 
                var id = "id-" + objects.length;
                var object = appstax.object("foo", {sysObjectId:id});
                objects.push(object);
                for(var i = 0; i < 3; i++) {
                    var status = undefined;
                    if(objects.length > i) {
                        status = appstax.status(objects[i]);
                    }
                    statuses.push(status);
                }
                res.end() 
            }, 150);
        });

        [0,1,2].forEach(function(i) {
            setTimeout(function() {
                unirest("get", "http://localhost:5678/").end();
            }, i * 100);
        });

        setTimeout(function() {
            expect(statuses[0]).to.equal("saved");
            expect(statuses[1]).to.equal(undefined);
            expect(statuses[2]).to.equal(undefined);

            expect(statuses[3]).to.equal(undefined);
            expect(statuses[4]).to.equal("saved");
            expect(statuses[5]).to.equal(undefined);

            expect(statuses[6]).to.equal(undefined);
            expect(statuses[7]).to.equal(undefined);
            expect(statuses[8]).to.equal("saved");

            done();
        }, 700);
    });

});