new Vue({
    el: '#app',
    data: {
        screen: 'settings',
        locationSearch: null,
        locationLat: null,
        locationLong: null,
        productId: null,
        productData: null
    },

    init: function() {

        var that = this;

        var $obj = $(document).gMapsLatLonPicker();

        $obj.params.strings.markerText = "Arrastrá el puntero";

        $obj.params.displayError = function(message) {
            console.log("MAPS ERROR: " + message); // instead of alert()
        };

        this._locationPickerContainer = $("#location-picker");

        this._locationPickerLat = this._locationPickerContainer.find('.gllpLatitude');
        this._locationPickerLong = this._locationPickerContainer.find('.gllpLongitude');
        this._locationPickerSearch = this._locationPickerContainer.find('.gllpSearchField');

        $obj.init(this._locationPickerContainer);

        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(location) {
                that._locationPickerLat.val(location.coords.latitude);
                that._locationPickerLong.val(location.coords.longitude);
                $(document).trigger("gllp_update_fields");
            }, function() {});
        }

    },

    computed: {

        minPrice: function() {
            if (this.productData && this.productData.sucursales) {
                return _.min(this.productData.sucursales, function(sucursal) {
                    return sucursal.preciosProducto.precioLista;
                });
            }
        },


        maxPrice: function() {
            if (this.productData && this.productData.sucursales) {
                return _.max(this.productData.sucursales, function(sucursal) {
                    return sucursal.preciosProducto.precioLista;
                });
            }
        }

    },

    methods: {

        switchScreen: function(screen) {
            this.screen = screen;
        },

        saveLocation: function() {
            this.locationLat = this._locationPickerLat.val();
            this.locationLong = this._locationPickerLong.val();
            this.screen = 'scanner';
        },

        imageChanged: function(e) {
            var that = this;

            if (e.target.files && e.target.files.length) {
                var url = URL.createObjectURL(e.target.files[0]);
                Quagga.decodeSingle({
                    decoder: {
                        readers: ["ean_reader"] // List of active readers
                    },
                    locate: true,
                    src: url
                }, function(result) {
                    console.log('decoded', result);
                    if (result.codeResult) {
                        that.productId = result.codeResult.code;
                        that.screen = 'product';
                    }
                })
            }
        }

    },

    watch: {

        locationSearch: _.throttle(function() {
            this._locationPickerSearch.attr('string', this._locationPickerSearch.val());
            $(document).trigger("gllp_perform_search", this._locationPickerSearch);
        }, 3000),

        productId: _.throttle(function() {
            if (('' + this.productId).length != 13) {
                return;
            }

            var that = this;
            var url = 'https://8kdx6rx8h4.execute-api.us-east-1.amazonaws.com/prod/producto?';

            url += $.param({
                limit: 50,
                id_producto: this.productId,
                lat: this.locationLat,
                lng: this.locationLong
            });

            $.getJSON(url).then(function(response) {
                console.log(that.productData = response);
            });
        }, 3000)
    }
})
