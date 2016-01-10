'use strict';

var request = require('request');
var async = require('async');
var util = require('util');

module.exports = function(grunt){
	grunt.registerTask('fetch-category', function(){

			//Open grunt async
			var done = this.async();

			var _config;
      var _query1 = '[out:json];relation["network"="';
			var _query2 = '"]["route_master"="bus"];(._;>;);out tags;';

			var LoadCategoryJSON = function(callback){
				grunt.log.writeln('Load Category JSON...');

				//Load config file
				_config = grunt.file.readJSON("LocalData/Config.json");
				//Load category json
				var cJson = grunt.file.readJSON(_config.CategoryJSON);

				if(cJson !== undefined)
					callback(null, cJson);
				else
					callback("IOException", null);
			}

			var DownloadRouteXML = function(callback){
				grunt.log.writeln('Downloading Route Data...');
	      request('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(_query1 + _config.TargetNetwork +_query2) , function(error, response , body){
	          if (error){
							grunt.log.writeln('OverPass Error :' + error.message);
							callback(error, null);
						}
	          else{
    						callback(null, body);
						}

	      });
			}

			//Do two things , download json after load category;
			async.series([LoadCategoryJSON , DownloadRouteXML],
				function(err, results){
					if(err){
						grunt.log.errorlns(err);
						done(false);
					}
					else {

						grunt.log.writeln('Collect routes to each category...');

						var _category = results[0];
						var _allRoutes = JSON.parse(results[1]);

						_category.map(function(Cvalue, index){

								var _output = [];

								_allRoutes.elements.map(function(Rvalue, index){
									if(Rvalue.tags["ref:category"] == Cvalue.categoryOSMRef){

										//skip render via if the tag doesn't exist.
										var _FromTo;
										if(Rvalue.tags["via"] === undefined)
											_FromTo = Rvalue.tags["from"] + "-" + Rvalue.tags["to"];
										else
											_FromTo = Rvalue.tags["from"] + "-" + Rvalue.tags["via"] + "-" + Rvalue.tags["to"];

										var _categoriedRoute = {
											RouteName: Rvalue.tags["name"],
											RouteFromTo: _FromTo,
											RouteOSMRelation: Rvalue.id,
											RouteCode: Rvalue.tags["ref:querycode"]
										}

										_output.push(_categoriedRoute);
									}
								});

								var _outputString = JSON.stringify(_output);
								grunt.file.write("LocalData/BusRoute_" + Cvalue.categoryOSMRef + ".json", _outputString);

								//Check write file successfully
								if(grunt.file.exists("LocalData/BusRoute_" + Cvalue.categoryOSMRef + ".json"))
									grunt.log.writeln("LocalData/BusRoute_" + Cvalue.categoryOSMRef + ".json has been generated.");

								_output = [];
						});

						done(true);
					}
				}
			);
	});
};
