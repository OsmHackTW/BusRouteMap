var MainPageVars = {
  RouteDownloadManager : undefined,
  CurrentSelectedRouteArray : [],
  CurrentColorScheme : undefined,
  ColorSchemeCollect : {},
  RouteJsonUrl : "LocalData/BusRoute_"
}

$(document).ready(function() {

    CommonVars.InitConfig(function(_config){
        SetupL10nString(_config);
    });

    //console.log(CommonVars.ConfigObject);

    CommonVars.MapObject = L.map('map').setView([23.1852, 120.4287], 11);

    $('select').selectpicker();

    //Render Map
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: CommonVars.MapAttribution
    }).addTo(CommonVars.MapObject);

    //ShowOptions
    InitCategories();

    $('#SelectCategory').change(function() {
        ChangeCategory();
    });

    $('#SelectRoute').change(function() {
        SetSelectedRoute();
    });

    $('input[name="dirctions"]:radio').change(function() {
        SetSelectDirection();
        //console.log("Change!");
    });

    $("#Info_toggle").click(function(e) {
        e.preventDefault();
        window.open(CommonVars.ConfigObject.BusRouteInfoUrl + MainPageVars.CurrentSelectedRouteArray[1] , MainPageVars.CurrentSelectedRouteArray[1]);
    });
});

function SetupL10nString (cObj){
  $(".navbar-brand").append(cObj.TargetCity + cObj.Localization["Title"]);
  $("title").append(cObj.TargetCity + cObj.Localization["Title"]);
  $("#navInfo").append(cObj.Localization["Info"] + ":");
  $("#RForward").append(cObj.Localization["Forward"]);
  $("#RBackward").append(cObj.Localization["Backward"]);
}

//Function Section-----------------------
function InitCategories() {
    MainPageVars.RouteDownloadManager = new L.Bus.RenderManager();

    $.getJSON(CommonVars.CategoryJsonUrl + CommonVars.JsonExtension , function(data) {

        var categoryList = $("#SelectCategory").empty();

        $.each(data, function(i, item) {
            //console.log(item.categoryOSMRef);
            categoryList.append($('<option></option>').text(item.categoryName).attr('value', item.categoryOSMRef));

            //window.alert(RouteColorSettings["LineColor"]);
            MainPageVars.RouteDownloadManager.InitStopIconOption(item.categoryOSMRef , item.colourScheme);

            //Save Color Setting
            MainPageVars.ColorSchemeCollect[item.categoryOSMRef] = item.colourScheme;
        });

        $('#SelectCategory').selectpicker('refresh');

        //Init Default Route List
        SetRoutesList("CityBus");
    });
}

function ChangeCategory() {
    var SelectedId = $("#SelectCategory option:selected").attr('value');
    if (SelectedId !== undefined) {
        //window.alert("Coming!");
        SetRoutesList(SelectedId);
    }
}

function SetRoutesList(category) {
    var routeList = $("#SelectRoute").empty();

    MainPageVars.CurrentColorScheme = MainPageVars.ColorSchemeCollect[category];

    //console.log(currentLineColor);

    //Change Color
    MainPageVars.RouteDownloadManager.InitLeafletOption(category, MainPageVars.CurrentColorScheme);

    $.getJSON(MainPageVars.RouteJsonUrl + category + CommonVars.JsonExtension , function(data) {
        $.each(data, function(i, item) {
            routeList.append($('<option></option>').text(item.RouteName).attr('value', item.RouteOSMRelation + ',' + item.RouteCode).attr('label', item.RouteFromTo));
        });

        $('#SelectRoute').selectpicker('refresh');

        SetSelectedRoute();
    });
}

function SetSelectedRoute() {
    //var description = $("#RouteDes").empty();
    /* var SelectedRoute;
    //window.alert($("#SelectRoute option:selected").attr('label'));
    SelectedRoute = $("#SelectRoute option:selected").attr('label'); */

    var currentSelectedRoute = $("#SelectRoute option:selected").attr('value');

    MainPageVars.CurrentSelectedRouteArray = currentSelectedRoute.split(",");

    SetSelectDirection();

    /* if (SelectedRoute !== undefined   && description !== undefined ) {
        //description.text(SelectedRoute);
        //window.alert(SelectedRouteID);
        SetSelectDirection();
    } */
}

function SetSelectDirection() {
    var dir = $('input[name="dirctions"]:checked').val();

    MainPageVars.RouteDownloadManager.DownloadRouteMaster(MainPageVars.CurrentSelectedRouteArray[0], dir, null);
}

function QueryRealtimeBus() {
      var StopCode = $("#codeID").text();
      window.open(CommonVars.ConfigObject.BusStopRealTimeUrl + StopCode , StopCode);
}
