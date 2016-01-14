var CommonVars = {
  ConfigJsonUrl : "LocalData/Config",
  CategoryJsonUrl : "LocalData/MainCategory",
  JsonExtension : ".json",
  MapAttribution : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  ConfigObject : undefined,
  MapObject : undefined,
  InitConfig : function(doSomeThings) {
      $.getJSON(CommonVars.ConfigJsonUrl + CommonVars.JsonExtension , function(data) {
          CommonVars.ConfigObject = data;
          doSomeThings(data);
      });
  }
}
