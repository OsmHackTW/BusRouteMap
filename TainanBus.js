//Resource Paths
var categoryJsonUrl = "LocalData/MainCategory";
var routeJsonUrl = "LocalData/BusRoute";
var routeJsonExtension = ".json";

var map = L.map('map').setView([23.1852, 120.4287], 11);

$( document ).ready(function() {
	//ShowOptions
	InitCategories();

	//Render Map
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	$('#SelectCategory').change(function(){
     	ChangeCategory();
    });

    $('#SelectRoute').change(function(){
     	SetSelectedRoute();
    });

    $("#menu-toggle").click(function(e) {
		e.preventDefault();
		$("#wrapper").toggleClass("toggled");
	});
});

//Function Section-----------------------
function InitCategories()
{
	$.getJSON(categoryJsonUrl + routeJsonExtension, function(data){

		var categoryList = $("#SelectCategory").empty();

		$.each(data, function (i, item){
			//window.alert(item.categoryName);
			categoryList.append($('<option></option>').text(item.categoryName).attr('value', item.categoryIndex));

			//window.alert(RouteColorSettings["LineColor"]);
			InitAllIconsOption(item.categoryIndex);
			//Save Color Setting
			LineColor.push(item.categoryLineColor);
		});

		//Init Default Route List
		SetRoutesList(1);                      
	});
}

function ChangeCategory(){
	var SelectedId = $("#SelectCategory option:selected").attr('value');
	if(SelectedId !== undefined){
		//window.alert("Coming!");
		SetRoutesList(SelectedId);
	}
}

function SetRoutesList(id){
	var routeList = $("#SelectRoute").empty();

	currentLineColor = LineColor[id - 1];

	//console.log(currentLineColor);

	//Change Color
	InitLeafletOptions(id);

	$.getJSON(routeJsonUrl + id + routeJsonExtension, function(data){
		$.each(data, function(i, item){
			if($.browser.mozilla)
				routeList.append($('<option></option>').text(item.RouteName).attr('value', item.RouteOSMRelation).attr('label', item.RouteFromTo));
			else
				routeList.append($('<option></option>').text(item.RouteFromTo).attr('value', item.RouteOSMRelation).attr('label', item.RouteName));
		});


		SetSelectedRoute();
	});
}

function SetSelectedRoute(){
	var description = $("#RouteDes").empty();
	var SelectedRoute;
	//window.alert($("#SelectRoute option:selected").attr('label'));
	if($.browser.mozilla)
		SelectedRoute = $("#SelectRoute option:selected").attr('label');
	else
		SelectedRoute = $("#SelectRoute option:selected").text();

	var SelectedRouteID = $("#SelectRoute option:selected").attr('value');

	if(SelectedRoute !== undefined && description !== undefined){
		description.text(SelectedRoute);
		//window.alert(SelectedRouteID);
		DownloadRouteMaster(SelectedRouteID);
	}
}