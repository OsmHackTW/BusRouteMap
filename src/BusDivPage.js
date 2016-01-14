var DivPageVars = {
  AllRoutesJsonUrl : "LocalData/AllBusRoutes",
  RouteDownloadManager : undefined,
  DivString : "#map",
  DirControl : undefined,
  InfoControl : undefined,
  ColourSchemeCollect : {},
  RouteElements: []
}

$(document).ready(function() {

    CommonVars.InitConfig(function(config){
        var DivElement = $(DivPageVars.DivString);

        if (DivElement === undefined || DivElement.attr('bus-ref') === undefined) {
            window.alert("找不到地圖Div或編號不存在!");
            return;
        }
        else {
            CreateBusMap(DivElement.attr('bus-ref'));
        }
    });
});

function CreateBusMap(id) {

    DivPageVars.RouteDownloadManager = new L.Bus.RenderManager();

    CommonVars.MapObject = L.map('map').setView([23.1852, 120.4287], 11);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: CommonVars.MapAttribution
    }).addTo(CommonVars.MapObject);

    if(id.search(",") === -1)
        GetRouteByCode(id , 'NoMulti' , CommonVars.MapObject);
    else
        GetRouteByCode(id , 'Multi' , CommonVars.MapObject);
}

function GetRouteByCode(code , isMulti , map) {

    $.getJSON(CommonVars.CategoryJsonUrl + CommonVars.JsonExtension , function(data) {
        $.each(data, function(i, item) {
            DivPageVars.RouteDownloadManager.InitStopIconOption(item.categoryOSMRef , item.colourScheme);

            DivPageVars.ColourSchemeCollect[item.categoryOSMRef] = item.colourScheme;
            //ColorSchemeCollect.push(item.colourScheme);
        });

        var eachIdCode;

        if(isMulti === 'Multi')
            eachIdCode = code.split(",");
        else{
            eachIdCode = [];
            eachIdCode.push(code);
        }

        $.getJSON(DivPageVars.AllRoutesJsonUrl + CommonVars.JsonExtension , function(data) {
            //Get Data from assigned codes
            for(var j = 0 ; j < eachIdCode.length ; ++j){
                $.each(data, function(i, item) {
                    if (eachIdCode[j] == item.RouteRef) {

                        //console.log(item.RouteOSMRelation);
                        var Element = {
                            Category: item.RouteCategory,
                            RelationID: item.RouteOSMRelation,
                            Name: item.RouteName,
                            CodeNum: item.RouteCode,
                            OneWay: item.OneWayRoute !== undefined
                        }

                        DivPageVars.RouteElements.push(Element);
                        return false;
                    }
                });
            }

            if (eachIdCode.length !== DivPageVars.RouteElements.length) {
                window.alert("編號有誤!");
            }
            else {
                //Add Route Select Dropdown-box
                map.addControl(new L.BusSelectRouteControl(DivPageVars.RouteElements));

                if(DivPageVars.DirControl === undefined){
                    DivPageVars.DirControl = new L.BusDirControl();
                    map.addControl(DivPageVars.DirControl);
                }

                if(DivPageVars.InfoControl === undefined){
                    DivPageVars.InfoControl = new L.BusInfoControl();
                    map.addControl(DivPageVars.InfoControl);
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

    currentScheme = DivPageVars.ColourSchemeCollect[SelectedElementArray[0]];

    DivPageVars.RouteDownloadManager.InitLeafletOption(SelectedElementArray[0], currentScheme);

    //Refresh content of the direction control
    if(DivPageVars.DirControl !== undefined){
        DivPageVars.DirControl.RefreshRelationID(SelectedElementArray[1]);

        if(SelectedElementArray[2] === 'true')
            DivPageVars.DirControl.ToggleVisible(false);
        else
            DivPageVars.DirControl.ToggleVisible(true);
    }

    if(DivPageVars.InfoControl !== undefined){
        DivPageVars.InfoControl.RefreshRelationCode(SelectedElementArray[3]);
    }

    SetSelectDir();
}

function SetSelectDir() {
    var dir = $('input[name="direction"]:checked').val();

    DivPageVars.RouteDownloadManager.DownloadRouteMaster(DivPageVars.DirControl._busRelationID, dir, DivPageVars.DivString);
}

function QueryRealtimeBus() {
      var StopCode = $("#codeID").text();
      window.open(CommonVars.ConfigObject.BusStopRealTimeUrl + StopCode , StopCode);
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
        $(OptionContainer).html('<a id="rLink" href="#">'+ CommonVars.ConfigObject.Localization["Info"] +'</a>');

        return OptionContainer;
    },

    onRemove: function(map) {

    },

    RefreshRelationCode: function(NewCode){
        this._busRelationCode = NewCode;
        $('#rLink').html('<a id="rLink" href="' + CommonVars.ConfigObject.BusRouteInfoUrl + this._busRelationCode + '" target="_blank">'+ CommonVars.ConfigObject.Localization["Info"] +'</a>');
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
        var ForwardOption = '<input type="radio" name="direction" value="forward" checked>'+ CommonVars.ConfigObject.Localization["Forward"] +'<br/>';
        var BackwardOption = '<input type="radio" name="direction" value="backward">'+ CommonVars.ConfigObject.Localization["Backward"] +'';

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
            var optionE = '<option label="'+ this._RouteElements[i].Name +'" value="'+ this._RouteElements[i].Category + ','
            + this._RouteElements[i].RelationID + ',' + this._RouteElements[i].OneWay +
             ',' + this._RouteElements[i].CodeNum + '">'+ this._RouteElements[i].Name +'</option>';

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
