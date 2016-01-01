//Resource Paths
var routeJsonUrl = "LocalData/BusRoute";

var currentSelectedRouteArray;
var currentColorScheme;
var ColorSchemeCollect = [];

var RouteDownloadManager;

$(document).ready(function() {

    map = L.map('map').setView([23.1852, 120.4287], 11);

    $('select').selectpicker();

    //Render Map
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

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
        window.open(routeInfoUrl + currentSelectedRouteArray[1] , currentSelectedRouteArray[1]);
    });
});

//Function Section-----------------------
function InitCategories() {
    RouteDownloadManager = new L.TainanBus.RenderManager();

    $.getJSON(categoryJsonUrl + routeJsonExtension, function(data) {

        var categoryList = $("#SelectCategory").empty();

        $.each(data, function(i, item) {
            //window.alert(item.categoryName);
            categoryList.append($('<option></option>').text(item.categoryName).attr('value', item.categoryIndex));

            //window.alert(RouteColorSettings["LineColor"]);
            RouteDownloadManager.InitStopIconOption(item.categoryIndex);
            //Save Color Setting
            var ColorScheme = {
                MainLineColor: item.categoryLineColor,
                ExtendLineColor: item.categoryLineColor2
            }
            ColorSchemeCollect.push(ColorScheme);
        });

        $('#SelectCategory').selectpicker('refresh');

        //Init Default Route List
        SetRoutesList(1);
    });
}

function ChangeCategory() {
    var SelectedId = $("#SelectCategory option:selected").attr('value');
    if (SelectedId !== undefined) {
        //window.alert("Coming!");
        SetRoutesList(SelectedId);
    }
}

function SetRoutesList(id) {
    var routeList = $("#SelectRoute").empty();

    currentColorScheme = ColorSchemeCollect[id - 1];

    //console.log(currentLineColor);

    //Change Color
    RouteDownloadManager.InitLeafletOption(id, currentColorScheme);

    $.getJSON(routeJsonUrl + id + routeJsonExtension, function(data) {
        $.each(data, function(i, item) {
            routeList.append($('<option></option>').text(item.RouteName).attr('value', item.RouteOSMRelation + ',' + item.RouteCode).attr('label', item.RouteFromTo));
        });

        $('#SelectRoute').selectpicker('refresh');

        SetSelectedRoute();
    });
}

function SetSelectedRoute() {
    var description = $("#RouteDes").empty();
    var SelectedRoute;
    //window.alert($("#SelectRoute option:selected").attr('label'));
    SelectedRoute = $("#SelectRoute option:selected").attr('label');

    var currentSelectedRoute = $("#SelectRoute option:selected").attr('value');

    currentSelectedRouteArray = currentSelectedRoute.split(",");

    if (SelectedRoute !== undefined && description !== undefined) {
        description.text(SelectedRoute);
        //window.alert(SelectedRouteID);
        SetSelectDirection();
    }
}

function SetSelectDirection() {
    var dir = $('input[name="dirctions"]:checked').val();

    RouteDownloadManager.DownloadRouteMaster(currentSelectedRouteArray[0], dir, null);
}

function QueryRealtimeBus() {
      var StopCode = $("#codeID").text();
      window.open(RealtimeBusURL + StopCode , StopCode);
}
