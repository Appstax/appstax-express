
Appstax middleware for express.js
=================================

- Forwards the "x-appstax-sessionid" header to calls using the appstax-js sdk.
- Sets the neccesary CORS headers for using the appstax sdk on the client side.

Installing
----------

```bash
> npm install appstax-express --save
```

Example usage
-------------

You initialize appstax with your app key as usual, and add use `appstax.sessions()` and `appstax.cors()` to apply the neccesary middleware.

```javascript
var express = require("express");
var appstax = require("appstax-express");

var app = express();

appstax.init("your-app-key");
app.use(appstax.sessions());
app.use(appstax.cors("mydomain.appstax.io"));

app.get("/api/mydata", function(req, res) {

  // calls to appstax sdk methods will have the correct session id
  appstax.findAll("messages").then(function(messages) {
    // returns objects where the requesting session has read access
  })

});
```

