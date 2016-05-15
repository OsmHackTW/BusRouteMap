"use strict";

var request = require('request');
var async = require('async');
//var util = require('util');

module.exports = function(grunt){
	grunt.registerTask('fetch-all', function(chooseServer){
    var done = this.async();

		var _FrenchServer = "https://overpass-api.de/api/interpreter?data=";
		var _TaiwanServer = "https://overpass.nchc.org.tw/api/interpreter?data=";

		var _query1 = '[out:json];relation["network"="';
		var _query2 = '"]["route_master"="bus"];(._;>;);out body;';

		var LoadConfigJSON = function(callback){
			grunt.log.writeln('Load Config JSON...');

			//Load config file
			var _config = grunt.file.readJSON("LocalData/Config.json");

			callback(null, _config);
		};

		var DownloadRouteXML = function(arg1 , callback){
			grunt.log.writeln('Downloading Route Data...');

			var _FinalServer;

			if(chooseServer === 'Taiwan')
			{
				_FinalServer = _TaiwanServer;
			}
			else if(chooseServer === 'French')
			{
				_FinalServer = _FrenchServer;
			}

			request(_FinalServer + encodeURIComponent(_query1 + arg1.TargetNetwork +_query2) , function(error, response , body){
					if (error){
						grunt.log.writeln('OverPass Error :' + error.message);
						callback(error, null);
					}
					else{
							callback(null, body);
					}

			});
		};

		async.waterfall([LoadConfigJSON , DownloadRouteXML],
			function(err, result){
				if(err){
					grunt.log.errorlns(err);
					done(false);
				}
				else {

					grunt.log.writeln('Convert Data...');

					var _output = [];
					var _allRoutes = JSON.parse(result);

					_allRoutes.elements.map(function(value, index){

						var isOneWay = true;

						value.members.map(function(Mvalue, Mindex){
							if(Mvalue.role === "backward" || Mvalue.role === "backward_extend"){
								isOneWay = false;
							}
						});

						var _categoriedRoute = {
							RouteRef: value.tags.ref,
							RouteName: value.tags.name,
							RouteCategory: value.tags["ref:category"],
							RouteOSMRelation: value.id,
							RouteCode: value.tags["ref:querycode"]
						};

						if(isOneWay === true){
							_categoriedRoute.OneWayRoute = true;
						}

						_output.push(_categoriedRoute);
					});

					var _outputString = JSON.stringify(_output);
					grunt.file.write("LocalData/AllBusRoutes.json", _outputString);

					//Check write file successfully
					if(grunt.file.exists("LocalData/AllBusRoutes.json")){
						grunt.log.writeln("LocalData/AllBusRoutes.json has been generated.");
					}

					done(true);
				}
			}
		);
  });
};
