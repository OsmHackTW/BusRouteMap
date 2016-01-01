var AllRoutesJsonUrl = "LocalData/AllBusRoutes";

var RouteDownloadManager;

var DivString = '#map';

var DirControl;
var InfoControl;
var ColorSchemeCollect = [];
var RouteElements = [];

//var currentRelation;

$(document).ready(function() {
    var DivElement = $(DivString);

    if (DivElement === undefined || DivElement.attr('bus-ref') === undefined) {
        window.alert("找不到地圖Div或編號不存在!");
        return;
    } else {
        CreateBusMap(DivElement.attr('bus-ref'));
    }
});

function CreateBusMap(id) {

    RouteDownloadManager = new L.TainanBus.RenderManager();

    map = L.map('map').setView([23.1852, 120.4287], 11);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: MapAttribution
    }).addTo(map);

    if(id.search(",") === -1)
        GetRouteByCode(id , 'NoMulti');
    else
        GetRouteByCode(id , 'Multi');
}

function GetRouteByCode(code , isMulti) {

    $.getJSON(categoryJsonUrl + routeJsonExtension, function(data) {
        $.each(data, function(i, item) {
            RouteDownloadManager.InitStopIconOption(item.categoryIndex);
            //Save Color Setting
            var ColorScheme = {
                MainLineColor: item.categoryLineColor,
                ExtendLineColor: item.categoryLineColor2
            }
            ColorSchemeCollect.push(ColorScheme);
        });

        if(isMulti === 'Multi')
            var eachIdCode = code.split(",");
        else{
            var eachIdCode = [];
            eachIdCode.push(code);
        }

        $.getJSON(AllRoutesJsonUrl + routeJsonExtension, function(data) {
            //Get Data from assigned codes
            for(var j = 0 ; j < eachIdCode.length ; ++j){
                $.each(data, function(i, item) {
                    if (eachIdCode[j] == item.RouteCodeName) {

                        //console.log(item.RouteOSMRelation);
                        var Element = {
                            Category: item.RouteCategory,
                            RelationID: item.RouteOSMRelation,
                            Name: item.RouteName,
                            Code: item.RouteCodeName,
                            CodeNum: item.RouteCode,
                            OneWay: item.OneWayRoute !== undefined

                        }

                        RouteElements.push(Element);
                        return false;
                    }
                });
            }

            if (eachIdCode.length !== RouteElements.length) {
                window.alert("編號有誤!");
            }
            else {
                //Add Route Select Dropdown-box
                map.addControl(new L.BusSelectRouteControl(RouteElements));

                if(DirControl === undefined){
                    DirControl = new L.BusDirControl();
                    map.addControl(DirControl);
                }

                if(InfoControl === undefined){
                    InfoControl = new L.BusInfoControl();
                    map.addControl(InfoControl);
                }

                //Single Route should hidden the control
                if(isMulti === 'NoMulti'){
                    $('.selRoute').css('visibility', 'hidden');
                    $('#selr').css('visibility', 'hidden');
                }

                //Init
                SetSelectRoute();

                //Event Binding
                $('#selr').change(function(){
                    SetSelectRoute();
                });

                //Event Binding
                $('input[name="direction"]:radio').change(function() {
                    SetSelectDir();
                });
            }
        });
    });
}

function SetSelectRoute() {
    var SelectedElement = $("#selr option:selected").attr('value');

    var SelectedElementArray = SelectedElement.split(",");

    currentScheme = ColorSchemeCollect[SelectedElementArray[0] - 1];

    RouteDownloadManager.InitLeafletOption(SelectedElementArray[0], currentScheme);

    //Refresh content of the direction control
    if(DirControl !== undefined){
        DirControl.RefreshRelationID(SelectedElementArray[1]);

        if(SelectedElementArray[3] === 'true')
            DirControl.ToggleVisible(false);
        else
            DirControl.ToggleVisible(true);
    }

    if(InfoControl !== undefined){
        InfoControl.RefreshRelationCode(SelectedElementArray[4]);
    }

    SetSelectDir();
}

function SetSelectDir() {
    var dir = $('input[name="direction"]:checked').val();

    RouteDownloadManager.DownloadRouteMaster(DirControl._busRelationID, dir, DivString);
}

function QueryRealtimeBus() {
      var StopCode = $("#codeID").text();
      window.open(RealtimeBusURL + StopCode , StopCode);
}

L.BusInfoControl = L.Control.extend({
    options: {
        position: 'bottomleft'
      },

    initialize: function(options) {
        L.Util.setOptions(this, options);

        this._busRelationCode = 0;
    },

    onAdd: function(map){
        var OptionContainer = L.DomUtil.create('div', 'info');
        $(OptionContainer).html('<a id="rLink" href="#">路線資訊</a>');

        return OptionContainer;
    },

    onRemove: function(map) {

    },

    RefreshRelationCode: function(NewCode){
        this._busRelationCode = NewCode;
        $('#rLink').html('<a id="rLink" href="' + routeInfoUrl + this._busRelationCode + '" target="_blank">路線資訊</a>');
    }
});

L.BusDirControl = L.Control.extend({
    options: {
        position: 'topright'
    },

    initialize: function(options) {
        L.Util.setOptions(this, options);

        this._busRelationID = 0;
    },

    onAdd: function(map) {
        var ForwardOption = '<input type="radio" name="direction" value="forward" checked>往程<br/>';
        var BackwardOption = '<input type="radio" name="direction" value="backward">返程';

        var OptionContainer = L.DomUtil.create('div', 'dir');
        $(OptionContainer).append(ForwardOption, BackwardOption);

        //SetSelectDir(this._busRelationID);

        return OptionContainer;
    },

    onRemove: function(map) {

    },

    RefreshRelationID: function(NewId){
        this._busRelationID = NewId;
    },

    ToggleVisible : function(toggle){
        var element = $(".dir");
        if(element !== undefined){
            if(toggle === true)
                element.css('visibility', 'visible');
            else if(toggle === false)
                element.css('visibility', 'hidden');
        }
    }
});

L.BusSelectRouteControl = L.Control.extend({
    options: {
        position: 'topleft'
    },

    initialize: function(ids, options) {
        L.Util.setOptions(this, options);

        this._RouteElements = ids;
    },

    onAdd:function(map){
        var SelectElement = '<select id="selr">';
        var SelectElementEnd = '</select>';

        var options = "";

        for(var i = 0 ; i < this._RouteElements.length ; i++){
            var optionE = '<option label="'+ this._RouteElements[i].Name +'" value="'+ this._RouteElements[i].Category + ',' + this._RouteElements[i].RelationID + ',' + this._RouteElements[i].Code + ',' + this._RouteElements[i].OneWay + ',' + this._RouteElements[i].CodeNum + '">'+ this._RouteElements[i].Name +'</option>';

            //console.log(optionE);

            options += optionE;
        }

        var OptionContainer = L.DomUtil.create('div', 'selRoute');
        $(OptionContainer).append(SelectElement + options + SelectElementEnd);

        //SetSelectRoute();

        return OptionContainer;
    },

    onRemove: function(map) {

    }
});
