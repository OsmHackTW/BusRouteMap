L.Bus = {};

var BusRenderVars = {
  OSMAPIUrl : "http://api.openstreetmap.org/api/0.6/relation/",
  FullQuery : "/full",
  ButtonSet : '<button type="button" class="btn btn-default btn-sm" id="quetyBtn"><span class="glyphicon glyphicon-search" aria-hidden="true"></span>經過路線/動態</span></button>'
}

L.Bus.RenderManager = L.Class.extend({
    initialize: function() {
        this._RouteLayers = [];

        this._BusMainRouteLineOptions = {};
        this._BusExtendRouteLineOptions = {};
        this._BusIconOptions = {};

        this._currentBusMarker = null;
    },

    InitStopIconOption: function(name , colour) {
        var tmpIcon = L.MakiMarkers.icon({
            color : colour.StopColour,
            icon: "bus",
            size: "m"
        });

        //console.log(tmpIcon);

        this._BusIconOptions[name] = tmpIcon;
    },

    InitLeafletOption: function(id , scheme) {

        this._currentBusMarker = this._BusIconOptions[id];

        this._BusMainRouteLineOptions = {
            color: scheme.MainLineColour,
            opacity: 1,
            clickable: false
        };

        this._BusExtendRouteLineOptions = {
            color: scheme.ExtendLineColour,
            opacity: 1,
            clickable: false
        }
    },

    DownloadRouteMaster: function(id, dir , targetDiv) {

        //Remove all lines and markers
        if (this._RouteLayers.length > 0) {
            for (var i = 0; i < this._RouteLayers.length; i++) {
                this._RouteLayers[i].clearLayers();
            };
        }

        $(".leaflet-popup-pane").off("click","#quetyBtn",QueryRealtimeBus);

        var _thisClass = this;

        $.ajax({
            url: BusRenderVars.OSMAPIUrl + id,
            dataType: "xml",
            success: function(xml) {
                var currentRouteRelation = new L.Bus.getRoutesInMaster(xml);

                var loop = 0; //Check Dir is null or not

                _thisClass.BlockingMask({enable:true},targetDiv);

                for (var i = 0; i < currentRouteRelation.length; i++) {
                    if (currentRouteRelation[i].Direction === dir) {
                        _thisClass.RenderRoute(currentRouteRelation[i].Ref, currentRouteRelation[i].Extend , function(layer){
                            _thisClass._RouteLayers.push(layer);
                        });

                        loop++;
                    }
                };

                if (loop == 0) {

                    if(typeof(bootbox) === 'undefined')
                        window.alert("此路線為單向行駛!");
                    else
                        bootbox.alert("此路線為單向行駛!");
                }

                $(".leaflet-popup-pane").on("click","#quetyBtn",QueryRealtimeBus);

                window.setTimeout(function(){
                    _thisClass.BlockingMask({enable:false},targetDiv);
                },2000);
            },
            error: function() {
                if(typeof(bootbox) === 'undefined')
                    window.alert("資料載入失敗!");
                else
                    bootbox.alert("資料載入失敗!");

                window.setTimeout(function(){
                    _thisClass.BlockingMask(false,targetDiv);
                },2000);
            }
        });
    },

    RenderRoute: function(id, RouteType , callFunction) {

        var _thisClass = this;

        $.ajax({
            url: BusRenderVars.OSMAPIUrl + id + BusRenderVars.FullQuery,
            dataType: "xml",
            success: function(xml) {
                layer = new L.Bus.DataLayer(xml, RouteType, _thisClass).addTo(CommonVars.MapObject);

                if(RouteType === "MainRoute")
                    CommonVars.MapObject.fitBounds(layer.getBounds());

                if(callFunction !== null)
                    callFunction(layer);
            },
            error: function() {
                if(typeof(bootbox) === 'undefined')
                    window.alert("資料載入失敗!");
                else
                    bootbox.alert("資料載入失敗!");
            }
        });


    },

    BlockingMask: function(Obj, div) {
        if (Obj.enable === true) {
            if (div == undefined || div == null) {
                $.blockUI({
                    message: '<h1>載入中...</h1>',
                    css: {
                        border: 'none',
                        padding: '15px',
                        backgroundColor: '#000',
                        '-webkit-border-radius': '10px',
                        '-moz-border-radius': '10px',
                        'border-radius': '10px',
                        opacity: .5,
                        color: '#fff'
                    }
                });
            }
            else{
                $(div).block({
                    message: '<h1>載入中...</h1>',
                    css: {
                        border: 'none',
                        padding: '15px',
                        backgroundColor: '#000',
                        '-webkit-border-radius': '10px',
                        '-moz-border-radius': '10px',
                        'border-radius': '10px',
                        opacity: .5,
                        color: '#fff'
                    }
                });
            }
        }
        else {
            if(div == null || div == undefined)
                $.unblockUI();
            else
                $(div).unblock();
        }
    }
});

L.Bus.DataLayer = L.FeatureGroup.extend({
    options: {
        //areaTags: ['area', 'building', 'leisure', 'tourism', 'ruins', 'historic', 'landuse', 'military', 'natural', 'sport'],
        uninterestingTags: ['source', 'source_ref', 'source:ref', 'history', 'attribution', 'created_by', 'tiger:county', 'tiger:tlid', 'tiger:upload_uuid'],
        styles: {}
    },

    initialize: function(xml, RouteType, RenderManager, options) {
        L.Util.setOptions(this, options);

        //console.log(isExtend);

        //console.log(RenderManager);

        L.FeatureGroup.prototype.initialize.call(this);

        if (xml) {
            this.addData(xml, RouteType, RenderManager);
        }
    },

    addData: function(features, RouteType, RenderManager) {

        var MakerClusterOptions = {
            showCoverageOnHover: false,
            maxClusterRadius: 20
        }

        var markers = new L.MarkerClusterGroup(MakerClusterOptions);

        if (!(features instanceof Array)) {
            features = this.buildFeatures(features);
        }

        for (var i = 0; i < features.length; i++) {
            var feature = features[i],
                layer;

            if (feature.type === "node") {
                    var MarkerOption = {
                        icon: RenderManager._currentBusMarker,
                        opacity: 1,
                        zIndexOffset: 1000,
                        riseOnHover:true,
                        title: this.GetBusStopName(feature.tags)
                    }

                    //layer = L.marker(feature.latLng , MarkerOption).bindPopup(this.GetBusStopName(feature.tags));
                    markers.addLayer(
                    L.marker(feature.latLng, MarkerOption).
                    bindPopup("<h5>"+ this.GetBusStopName(feature.tags) +"</h5><br>站牌代碼：<b id='codeID'>"+ this.GetBusStopCode(feature.tags) + "</b><br>" + BusRenderVars.ButtonSet));
            } else {
                var latLngs = new Array(feature.nodes.length);

                for (var j = 0; j < feature.nodes.length; j++) {
                    latLngs[j] = feature.nodes[j].latLng;
                }

                if (RouteType === "MainRoute")
                    layer = L.polyline(latLngs, RenderManager._BusMainRouteLineOptions);
                else if (RouteType === "ExtendRoute")
                    layer = L.polyline(latLngs, RenderManager._BusExtendRouteLineOptions);
            }

            if (layer !== undefined) {
                layer.addTo(this);
                layer.feature = feature;
            }
        }

        if (markers !== undefined)
            markers.addTo(this);
    },

    buildFeatures: function(xml) {
        var features = [],
            nodes = L.Bus.getNodes(xml),
            ways = L.Bus.getWays(xml, nodes),
            relations = L.Bus.getRelations(xml, nodes, ways);

        for (var node_id in nodes) {
            var node = nodes[node_id];
            if (this.isBusStop(node)) {
                features.push(node);
            }
        }

        for (var i = 0; i < ways.length; i++) {
            var way = ways[i];
            features.push(way);
        }

        return features;
    },

    isBusStop: function(node) {
        var bIsBusStop = false;

        for (var key in node.tags) {
            if (node.tags[key] == "bus_stop") {
                bIsBusStop = true;
                break;
            }
        }

        return bIsBusStop;
    },

    GetBusStopName: function(tags) {
        var Name = "";

        for (var key in tags) {
            if (key == "name") {
                Name = tags[key];
                break;
            }
            //console.log(key);
        }

        return Name;
    },

    GetBusStopCode:function(tags){
        var Code = 0;

        for (var key in tags) {
            if (key == "ref") {
                Code = tags[key];
                break;
            }
            //console.log(key);
        }

        return Code;
    }
});

L.Util.extend(L.Bus, {

    getNodes: function(xml) {
        var result = {};

        var nodes = xml.getElementsByTagName("node");
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i],
                id = node.getAttribute("id");
            result[id] = {
                id: id,
                type: "node",
                latLng: L.latLng(node.getAttribute("lat"),
                    node.getAttribute("lon"),
                    true),
                tags: this.getTags(node)
            };
        }

        return result;
    },

    getWays: function(xml, nodes) {
        var result = [];

        var ways = xml.getElementsByTagName("way");
        for (var i = 0; i < ways.length; i++) {
            var way = ways[i],
                nds = way.getElementsByTagName("nd");

            var way_object = {
                id: way.getAttribute("id"),
                type: "way",
                nodes: new Array(nds.length),
                tags: this.getTags(way)
            };

            for (var j = 0; j < nds.length; j++) {
                way_object.nodes[j] = nodes[nds[j].getAttribute("ref")];
            }

            result.push(way_object);
        }

        return result;
    },

    getRoutesInMaster: function(xml) {
        var results = [];

        var rels = xml.getElementsByTagName("relation");
        for (var i = 0; i < rels.length; i++) {
            //Get all members
            var rel = rels[i];
            var members = rel.getElementsByTagName("member");

            for (var j = 0; j < members.length; j++) {
                if (members[j].getAttribute("type") === "relation") {

                    var Extend = "MainRoute";
                    var Dir = "forward";

                    switch (members[j].getAttribute("role")) {
                        case "forward":
                            {
                                Dir = "forward";
                                Extend = "MainRoute";
                            }
                            break;

                        case "backward":
                            {
                                Dir = "backward";
                                Extend = "MainRoute";
                            }
                            break;

                        case "forward_extend":
                            {
                                Dir = "forward";
                                Extend = "ExtendRoute";
                            }
                            break;

                        case "backward_extend":
                            {
                                Dir = "backward";
                                Extend = "ExtendRoute";
                            }
                            break;
                    }

                    var SingleResult = {
                        Ref: members[j].getAttribute("ref"),
                        Extend: Extend,
                        Direction: Dir
                    }

                    results.push(SingleResult);
                }
            }
        }

        return results;
    },

    getRelations: function(xml, nodes, ways) {
        var result = [];

        var rels = xml.getElementsByTagName("relation");
        for (var i = 0; i < rels.length; i++) {
            var rel = rels[i],
                members = rel.getElementsByTagName("member");

            var rel_object = {
                id: rel.getAttribute("id"),
                type: "relation",
                members: new Array(members.length),
                tags: this.getTags(rel)
            };

            for (var j = 0; j < members.length; j++) {
                if (members[j].getAttribute("type") === "node")
                    rel_object.members[j] = nodes[members[j].getAttribute("ref")];
                else // relation-way and relation-relation membership not implemented
                    rel_object.members[j] = null;
            }

            result.push(rel_object);
        }

        return result;
    },

    getTags: function(xml) {
        var result = {};

        var tags = xml.getElementsByTagName("tag");
        for (var j = 0; j < tags.length; j++) {
            result[tags[j].getAttribute("k")] = tags[j].getAttribute("v");
        }

        return result;
    }
});
