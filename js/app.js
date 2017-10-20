var initialSpaces = [{
        "name": "The Central Park",
        "location": { "lat":22.225206,  "lng": 84.862287 },
        "fs_id": "4eb15f4f9adf1abeffbd2fe4"
    },
    {
        "name": "Mayfair Rourkela",
        "location": { "lat": 22.227947, "lng":  84.821858 },
        "fs_id": "4bd1cf2c5e0cce720a06a284"
    },
    {
        "name": "Rourkela Railway Station",
        "location": { "lat": 22.227898,  "lng":84.861885 },
        "fs_id": "4c6cf99223c1a1cd55f71acf"
    },
    {
        "name": "Baskin Robbins",
        "location": { "lat": 22.22678, "lng": 84.863342 },
        "fs_id": "4ed11dbc722e01c5832ded2e"
    },
    {
        "name": "NIT, Rourkela ",
        "location": {"lat": 22.253718, "lng": 84.901143 },
        "fs_id": "4e38ee72c65bab738fcafafd"
    }
];

// Foursquare API
var BaseUrl = "https://api.foursquare.com/v2/venues/",
    fsClient_id = "client_id=0FGZHSJJQZ52CWQ2NFDXZNRECQ0YHODVLQIEGF1DXC1VG4NM",
    fsClient_secret = "&client_secret=C01R0AI41I0OSFXJBSGZODPGSXHSYBQYBWXI0W3AAK4WJ4YE",
    fsVersion = "&v=20170928";


// Create global variables to use in google maps
var map,infowindow,bounds;

function mapLoad() {
    "use strict";
    //Google map elements
    var mapOptions = {
        "center": {
            "lat": 22.260067, 
            "lng": 84.854809
        },
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        }
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    infowindow = new google.maps.InfoWindow({
        maxWidth: 150,
        content: ""
    });
    bounds = new google.maps.LatLngBounds();

    // Close infowindow when clicked elsewhere on the map
    map.addListener("click", function() {
        infowindow.close(infowindow);
    });

    // Recenter map upon window resize
    window.onresize = function() {
        map.fitBounds(bounds);
    };


    //Creating Space object
    var Space = function(data, id, map) {
        var self = this;
        this.name = ko.observable(data.name);
        this.location = data.location;
        this.marker = "";
        this.markerId = id;
        this.fs_id = data.fs_id;
        this.shortUrl = "";
        this.photoUrl = "";
    };

    
    function getContent(space) {
        var contentString = "<h3>" + space.name +
            "</h3><br><div style='width:200px;min-height:120px'><img src=" + '"' +
            space.photoUrl + '"></div><div><a href="' + space.shortUrl +
            '" target="_blank">More info in Foursquare</a><img src="img/foursquare_150.png">';
        var errorString = "Oops, Foursquare content not available.";
        if (space.name.length > 0) {
            return contentString;
        } else {
            return errorString;
        }
    }

    // marker effect
    function toggleBounce(marker) {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 700);
        }
    }

    function ViewModel() {
        var self = this;

        // Nav control
        this.isNavClosed = ko.observable(false);
        this.navClick = function() {
            this.isNavClosed(!this.isNavClosed());
        };

        
        this.spaceList = ko.observableArray();
        initialSpaces.forEach(function(item) {
            self.spaceList.push(new Space(item));
        });

        // Create a marker per space item
        this.spaceList().forEach(function(space) {
            var marker = new google.maps.Marker({
                map: map,
                position: space.location,
                animation: google.maps.Animation.DROP
            });
            space.marker = marker;
            
            bounds.extend(marker.position);
            // Create an onclick event to open an infowindow and bounce the marker at each marker
            marker.addListener("click", function(e) {
                map.panTo(this.position);
                
                map.panBy(0, -200);
                infowindow.setContent(getContent(space));
                infowindow.open(map, marker);
                toggleBounce(marker);
            });
        });

        // Foursquare API request
        self.getFoursquareData = ko.computed(function() {
            self.spaceList().forEach(function(space) {
                var venueId = space.fs_id + "/?";
                var foursquareUrl = BaseUrl + venueId + fsClient_id + fsClient_secret + fsVersion;

                // AJAX call to Foursquare
                $.ajax({
                    type: "GET",
                    url: foursquareUrl,
                    dataType: "json",
                    cache: false,
                    success: function(data) {
                        var response = data.response ? data.response : "";
                        var venue = response.venue ? data.venue : "";
                        space.name = response.venue.name;
                        space.shortUrl = response.venue.shortUrl;
                        space.photoUrl = response.venue.bestPhoto.prefix + "height150" +
                            response.venue.bestPhoto.suffix;
                    }
                });
            });
        });

        // Creating click for the list item
        this.itemClick = function(space) {
            var markerId = space.markerId;
            google.maps.event.trigger(space.marker, "click");
        };

        // Filtering the Space list
        self.filter = ko.observable("");

        this.filteredSpaceList = ko.dependentObservable(function() {
            var q = this.filter().toLowerCase();
            //var self = this;
            if (!q) {
                // Return self.spaceList() the original array;
                return ko.utils.arrayFilter(self.spaceList(), function(item) {
                    item.marker.setVisible(true);
                    return true;
                });
            } else {
                return ko.utils.arrayFilter(this.spaceList(), function(item) {
                    if (item.name.toLowerCase().indexOf(q) >= 0) {
                        return true;
                    } else {
                        item.marker.setVisible(false);
                        return false;
                    }
                });
            }
        }, this);
    }

    //knockout.js
    ko.applyBindings(new ViewModel());
}