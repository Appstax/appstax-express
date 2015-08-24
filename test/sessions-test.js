require("mocha");
var expect  = require("chai").expect;
var nock    = require("nock");
var http    = require("http");
var unirest = require("unirest");
var express = require("express");
var appstax = require("../src/appstax-express");

describe("sessions middleware", function() {

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

    it("should set appstax session id based on incoming appstax header", function(done) {
        var receivedSessionId = "";

        app.get("/", function(req, res) {
            receivedSessionId = appstax.sessionId();
            res.end();   
        });

        unirest("get", "http://localhost:5678/")
            .header("x-appstax-sessionid", "session1")
            .end(function(res) { 
                expect(receivedSessionId).equals("session1");
                done();
            });
    });

    it("should keep track of session ids across many concurrent requests", function(done) {
        var receivedSessionIds = [];

        app.get("/", function(req, res) {
            setTimeout(function() { 
                receivedSessionIds.push(appstax.sessionId());
                res.end() 
            }, 150);
        });

        [1,2,3,4,5].forEach(function(i) {
            var sessionId = "session-" + i;
            setTimeout(function() {
                unirest("get", "http://localhost:5678/")
                    .header("x-appstax-sessionid", sessionId)
                    .end();
            }, i * 100);
        });

        setTimeout(function() {
            expect(receivedSessionIds.length).equals(5);
            expect(receivedSessionIds[0]).equals("session-1");
            expect(receivedSessionIds[1]).equals("session-2");
            expect(receivedSessionIds[2]).equals("session-3");
            expect(receivedSessionIds[3]).equals("session-4");
            expect(receivedSessionIds[4]).equals("session-5");
            done();
        }, 700);
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
    })
    
    it("should forward the session id to appstax sdk calls", function(done) {
        var mock = nock("http://example.com/")
                    .matchHeader("x-appstax-appkey", "my-app-key")
                    .matchHeader("x-appstax-sessionid", "session1001")
                    .get("/objects/messages").reply(200, {objects:[]});

        app.get("/", function(req, res) {
            appstax.findAll("messages").then(function(messages) {
                res.end();
            }).fail(done);
        });

        unirest("get", "http://localhost:5678/")
            .header("x-appstax-sessionid", "session1001")
            .end(function(res) { 
                mock.done();
                done();
            });
    });
});