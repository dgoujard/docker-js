var request = require('request');
var querystring = require('querystring');

module.exports = function Client(url) {

    //this properly private stuff.
    var base_url = url;

    function RequestDocker(request_options,next) {
      request(request_options, function (error, response, body) {
        if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204)
          next(null,body);
        else
          next({statusCode:response.statusCode,body:body},null);
      });
    }

    return {
      info: function(next) {
        RequestDocker(base_url+'/info',next);
      },
      version: function(next) {
        RequestDocker(base_url+'/version',next);
      },
      search:function(term,next){
        RequestDocker({uri:base_url+'/images/search',qs:{term:term}},next);
      },
      inspectImage: function(imageId,next){
        RequestDocker(base_url+'/images/'+imageId+'/json',next);
      },
      inspectContainer: function(containerId,next){
        RequestDocker(base_url+'/containers/'+containerId+'/json',next);
      },
      containers: function(params,next){
        params = {
          only_ids:params.quiet?1:0,
          limit:params.latest?1:(params.limit)?params.limit:-1,
          all:params.all?1:0,
          trunc_cmd:params.quiet?1:0,
          since:params.since?params.since:null,
          before:params.before?params.before:null
        };
        RequestDocker({uri:base_url+'/containers/ps',qs:params},next);
      },
      createContainer: function(params,next){
        var autoStart = params.autoStart?params.autoStart:false;

        params = {
          Hostname:params.hostname?params.hostname:null,
          PortSpecs:params.ports?(params.ports instanceof Array)?params.ports:[params.ports]:null,
          User:params.user?params.user:null,
          Tty:params.tty?params.tty:false,
          OpenStdin:params.stdin_open?params.stdin_open:false,
          Memory:params.mem_limit?params.mem_limit:0,
          AttachStdin:false,
          AttachStdout:false,
          AttachStderr:false,
          Env:params.environment?params.environment:null,
          Cmd:params.command?(params.command instanceof Array)?params.command:[params.command]:null,
          Dns:params.dns?(params.dns instanceof Array)?params.dns:[params.dns]:null,
          Image:params.image?params.image:null,
          Volumes:params.volumes?params.volumes:null,
          VolumesFrom:params.volumes_from?params.volumes_from:null
        };
        RequestDocker({uri:base_url+'/containers/create',json:params,method:'POST'},function(error,containerData){
          if (error && error.statusCode == 404)
            next(params.Image+" is an unrecognized image. Please pull the image first.",null);
          else if (error)
            next(error,null);
          else{
            if(autoStart){
                RequestDocker({uri:base_url+'/containers/'+containerData.Id+'/start',method:'POST'},function(error,data){
                if (error && error.statusCode == 404)
                  next("No such container",null);
                if (error)
                  next(error,null);
                else
                  next(error,containerData);
              });
            }else
              next(error,containerData);
          }
        });
      },
      startContainer: function(containerId,next){
        RequestDocker({uri:base_url+'/containers/'+containerId+'/start',method:'POST'},function(error,data){
          if (error && error.statusCode == 404)
            next("No such container",null);
          if (error)
            next(error,null);
          else
            next(error,data);
        });
      },
      stopContainer: function(containerId,timer,next){
        RequestDocker({uri:base_url+'/containers/'+containerId+'/stop',json:{t:timer},method:'POST'},function(error,data){
          if (error && error.statusCode == 404)
            next("No such container",null);
          if (error)
            next(error,null);
          else
            next(error,data);
        });
      },
      killContainer: function(containerId,timer,next){
        RequestDocker({uri:base_url+'/containers/'+containerId+'/kill',method:'POST'},function(error,data){
          if (error && error.statusCode == 404)
            next("No such container",null);
          if (error)
            next(error,null);
          else
            next(error,data);
        });
      },
      restartContainer: function(containerId,timer,next){
        RequestDocker({uri:base_url+'/containers/'+containerId+'/restart',json:{t:timer},method:'POST'},function(error,data){
          if (error && error.statusCode == 404)
            next("No such container",null);
          if (error)
            next(error,null);
          else
            next(error,data);
        });
      }
    };
};
