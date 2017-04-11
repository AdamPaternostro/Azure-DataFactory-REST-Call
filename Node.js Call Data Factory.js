var https = require("https");
var querystring = require('querystring');

// https://rapiddg.com/blog/calling-rest-api-nodejs-script
function performRequest(context, host, path, method, header, data, success) {
     var options = {
        host: host,
        port: 443,
        path: path,
        method: method,
        headers: header
    };

    context.log('performRequest', host);

    var req = https.request(options, function(res) {
        //res.setEncoding('utf-8');
        //context.log("statusCode: ", res.statusCode);
        //context.log("headers: ", res.headers);

        var responseString = '';

        res.on('data', function(data) {
            context.log('res.on data',data);
            responseString += data;
        });

        res.on('end', function() {
             context.log('res.on end');
           if (responseString && responseString !== 'null' && responseString !== 'undefined') {
                context.log('res.on end responseString',responseString);
                var responseObject = JSON.parse(responseString);
                success(responseObject);
            } else {
                context.log('res.on end (empty)');
                var a = { success : true};
                success(a);                
            }
          
        });
    });

    if (JSON.stringify(data) != JSON.stringify({})) {
        context.log('Sending Body 1:', data);
        req.write(data);
    }
    else
    {
        var emptyJson =  JSON.stringify(data);
        context.log('Sending Body 2:', emptyJson);
        req.write(emptyJson);       
    }
    context.log('Request end 1');
    req.end();
    context.log('Request end 2');
}


    context.log('Webhook was triggered!');

    var successToken = false;

    var resource = 'https://management.core.windows.net/';
    var client_id = '<<REPLACE-ME>>';
    var grant_type= 'client_credentials';
    var client_secret = '<<REPLACE-ME>>';
    var subscription_id = '<<REPLACE-ME>>';
    var tenant_id = "<<REPLACE-ME>>";
    var resource_group_of_datafactory = "Sample.Azure.DataFactory";

    var data = {
        "resource" : resource,
        "client_id" : client_id,
        "grant_type" : grant_type,
        "client_secret" : client_secret
    };

     data = querystring.stringify(data);

    headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length // Buffer.byteLength(data,'utf-8') //
            };

    context.log(data);

    performRequest(context,
       'login.microsoftonline.com',
       '/' + tenant_id + '/oauth2/token', 
       'POST',
       headers,
       data,
       function(data) {
            context.log('Login', data.access_token.toString());
            
            var dataJson = {
                SliceStatus : "PendingExecution",
                updateType : 0} ;

            var dataString = JSON.stringify(dataJson);

            var authorization = "Bearer " + data.access_token.toString();

             headers1 = {
                        "Content-Type": 'application/json',
                        "Content-Length": dataString.length,
                        "x-ms-version": "2015-09-01",
                        "Authorization" : authorization
                        };

            context.log(headers1);

            // You can find this URL by using Fiddler and running your data factory job from the Azure Portal
            performRequest(context,
                'management.azure.com',
                '/subscriptions/' + subscription_id + '/resourcegroups/' + resource_group_of_datafactory +'/providers/Microsoft.DataFactory/datafactories/CopyDataFactoryJob/datasets/OutputDataset-8gw/slices/setstatus?api-version=2015-09-01&start=2016-08-01T00%3A00%3A00.000Z&end=2016-09-01T00%3A00%3A00.000Z', 
                'PUT',
                headers1,
                dataString,
                function(data1) {
                    context.log('Data Factory', data1);
                });

       });


  
