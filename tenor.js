var tenor = (function () {

    var apiKey = 'EWY0AYUO8K26'; 
    var getAnonIdUrl = "https://api.tenor.com/v1/anonid?key=" + apiKey;
    var lastAnonId;

    var limit = 24;
    var last_position = 0;
    var locale = 'en_US' // todo: auto-detect

    var tenorViewModel = new function () {
        var self = this;

        self.gifs = ko.observableArray().extend( {rateLimit : 50 });        
        self.currentSearchTerm = ko.observable().extend({ rateLimit: 500 });

        self.messages = ko.observableArray();

        self.isLoading = ko.observable(false);
        self.errorMessage = ko.observable();
        self.search = function () {
            last_position = 0;
            self.gifs.removeAll();
            if(self.currentSearchTerm()) {
                GetIdAndThenGetGifs();
            }            
        };

        self.getMore = function () {
            GetIdAndThenGetGifs();
        };

        self.checkIfBottom = function (data, event) {
            var element = event.target;
            if ($(element).scrollTop() + $(element).innerHeight() >= element.scrollHeight) {
                self.getMore();
            }
        };

        self.addToMessageList = function(element){
            self.messages.push(element);
        };

        self.handleMouseUp = function(data,event){
            var container = $("#gif-list");
            if (!container.is(event.target) && container.has(event.target).length === 0) 
            {
                container.hide();
            }
        };


        // todo: detect when the component is hidden and dispose subscrition
        var subscriptionToInputChange = self.currentSearchTerm.subscribe(function (data) {            
            if( !data ) {                
                self.gifs.removeAll();
                return;
            }            
            self.search();
        });


        

        function GetIdAndThenGetGifs() {
            self.errorMessage("");
            if (lastAnonId != undefined) {
                getGifs();                
                return;
            }

            $.get(getAnonIdUrl).done(function (data) {
                
                if(!data.anon_id) {
                    console.log(data.error);
                    self.errorMessage(data.error);
                    return;
                }

                lastAnonId = data.anon_id;
                getGifs();
            })
            .fail(requestFailedHandler)
            .always( function(){self.isLoading(false)});
        };

        function getGifs() {
            
            var search_url = "https://api.tenor.com/v1/search?tag=" + self.currentSearchTerm()
                + "&key=" + apiKey
                + "&limit=" + limit
                + "&pos=" + last_position
                + "&locale=" + locale
                + "&anon_id=" + lastAnonId;

            self.isLoading(true);
            $.get(search_url).done(function (data) {

                if(!data.results) {
                    self.errorMessage(data.error);
                    return;
                }
                data.results.forEach(element => {
                    self.gifs.push(element);
                });
                last_position = last_position + limit;
            })
            .fail(requestFailedHandler)
            .always(function(){ self.isLoading(false)});
        }

        function requestFailedHandler(jqXHR, textStatus, errorThrown) {
            console.log('Sorry.An error ocurred on the request:' + textStatus);
            console.log(errorThrown);
            self.errorMessage(errorThrown);
        }
    };

    return {
        tenorViewModel: tenorViewModel
    }

})();
