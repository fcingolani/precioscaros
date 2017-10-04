function fetchJSON(path, params) {

    var url = 'https://d3e6htiiul5ek9.cloudfront.net/prod/' + path + '?';

    url += $.param(params);

    return $.ajax({
        dataType: "json",
        url: url,
        headers: {
            'x-api-key': 'zIgFou7Gta7g87VFGL9dZ4BEEs19gNYS1SOQZt96'
        }
    });

}

new Vue({
    el: '#app',
    data: {
        screen: 'settings',
        locationSearch: null,
        locationLat: null,
        locationLong: null,
        productId: null,
        productData: null,
        locations: null
    },

    init: function () {

        var that = this;

        var $obj = $(document).gMapsLatLonPicker();

        $obj.params.strings.markerText = "Arrastrá el puntero";

        $obj.params.displayError = function (message) {
            console.log("MAPS ERROR: " + message); // instead of alert()
        };

        this._locationPickerContainer = $("#location-picker");

        this._locationPickerLat = this._locationPickerContainer.find('.gllpLatitude');
        this._locationPickerLong = this._locationPickerContainer.find('.gllpLongitude');
        this._locationPickerSearch = this._locationPickerContainer.find('.gllpSearchField');

        $obj.init(this._locationPickerContainer);

        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (location) {
                that._locationPickerLat.val(location.coords.latitude);
                that._locationPickerLong.val(location.coords.longitude);
                $(document).trigger("gllp_update_fields");
            }, function () { });
        }

    },

    computed: {

        minPrice: function () {
            if (this.productData && this.productData.sucursales) {
                return _.chain(this.productData.sucursales)
                    .filter(function (sucursal) {
                        return sucursal.preciosProducto;
                    })
                    .min(function (sucursal) {
                        return sucursal.preciosProducto.precioLista;
                    })
                    .value();
            }
        },


        maxPrice: function () {
            if (this.productData && this.productData.sucursales) {
                return _.chain(this.productData.sucursales)
                    .filter(function (sucursal) {
                        return sucursal.preciosProducto;
                    })
                    .max(function (sucursal) {
                        return sucursal.preciosProducto.precioLista;
                    })
                    .value();
            }
        }

    },

    methods: {

        switchScreen: function (screen) {
            this.screen = screen;
        },

        saveLocation: function () {
            var that = this;

            this.locationLat = this._locationPickerLat.val();
            this.locationLong = this._locationPickerLong.val();

            fetchJSON('sucursales', {
                limit: 50,
                lat: this.locationLat,
                lng: this.locationLong
            }).then(function (response) {
                console.log(that.locations = response.sucursales);
                that.screen = 'scanner';
            });

        },

        imageChanged: function (e) {
            var that = this;

            if (e.target.files && e.target.files.length) {
                var url = URL.createObjectURL(e.target.files[0]);
                Quagga.decodeSingle({
                    decoder: {
                        readers: ["ean_reader"] // List of active readers
                    },
                    locate: true,
                    src: url
                }, function (result) {
                    console.log('decoded', result);
                    if (result && result.codeResult) {
                        that.productId = result.codeResult.code;
                        that.screen = 'product';
                    } else {
                        alert('No fue posible detectar el código de barras');
                    }
                })
            }
        }

    },

    watch: {

        locationSearch: _.throttle(function () {
            this._locationPickerSearch.attr('string', this._locationPickerSearch.val());
            $(document).trigger("gllp_perform_search", this._locationPickerSearch);
        }, 3000),

        productId: _.throttle(function () {
            if (('' + this.productId).length != 13) {
                return;
            }

            var that = this;

            fetchJSON('producto', {
                limit: 50,
                id_producto: this.productId,
                array_sucursales: _.pluck(this.locations, 'id').join(',')
            }).then(function (response) {
                console.log(that.productData = response);
            });
        }, 3000)
    }
})
