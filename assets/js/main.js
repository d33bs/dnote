head.ready(function(){
var NoteView = Backbone.View.extend({
	el : "#noteview",
    	help_msg : {
		"input" : "Enter content with [bracketed] <variables> here.\n\n\"\"\nSurround multi-line entries with\ndouble double quotes to retain structure.\n\"\"\n\nEnter data for variables in the fields which appear below, then copy the modified content on the right."
	},
	initialize : function(){
		this.resize();
		$(window).on("resize",this.resize);
		this.vars = new VarsView({parent:this});
		this.output = new OutputView({parent:this});		
		this.input = new InputView({parent:this});
	},
    	events : {
		"click #info_click" : "open_info",
		"click .box_close" : "close_info"
	},
    	open_info : function(e){
		$("#info").show();
	},
    	close_info : function(e){
		$("#info").hide();
	},
    	resize : function(){
		$("#displaywrap").css({"margin-top":$("#topwrap").outerHeight()-3+"px","max-height":$(window).height()-$("#topwrap").outerHeight()+3});
	}
});
var InputView = Backbone.View.extend({
	el : "#input",
	initialize : function(){
		$("#input textarea").val(this.options.parent.help_msg["input"]);
		this.update();
		$("#input textarea").focus();
	},
	events : {
    		"keyup textarea" : "update"
	},
    	clean : function(raw){
		var s = raw;
		// smart single quotes and apostrophe
		s = s.replace(/[\u2018|\u2019|\u201A]/g, "\'");
		// smart double quotes
		s = s.replace(/[\u201C|\u201D|\u201E]/g, "\"");
		// ellipsis
		s = s.replace(/\u2026/g, "...");
		// dashes
		s = s.replace(/[\u2013|\u2014]/g, "-");
		// circumflex
		s = s.replace(/\u02C6/g, "^");
		// open angle bracket
		s = s.replace(/\u2039/g, "<");
		// close angle bracket
		s = s.replace(/\u203A/g, ">");
		// spaces
		s = s.replace(/[\u02DC|\u00A0]/g, " ");
		return s;
	},
	update : function(){
		var text = this.clean($("#input textarea").val());
		//	var output_var = text.match(/<(.*?)>/g);
		var output_var = text.match(/(\[(.*?)\]|<(.*?)>)/g);
		output_var = _.uniq(output_var, false);
		var view = this;
		this.options.parent.vars.remove_live();
		$.each(output_var, function(i,val){
			var search_name = val.substring(1,val.length-1); 
			var var_name = search_name.replace(/ /g,"_");
			if($("#"+var_name).length <= 0){
				view.options.parent.vars.add_input(var_name);
			}else if($("#"+var_name).length >= 0){
				view.options.parent.vars.add_live(var_name);
			}
		});
		this.options.parent.vars.remove_dead();
		if(text !== this.options.parent.help_msg["input"]){
			this.options.parent.output.update(text);
		}
		this.options.parent.vars.update();
	}
});
var VarsView = Backbone.View.extend({
	el : "#vars",
	initialize : function(){
	},
	events : {	
    		"keyup textarea" : "update"
	},
    	add_live : function(ele){
		$("#"+ele).addClass("live");
	},
    	remove_live : function(){
		$("#vars textarea").removeClass("live");
	},
    	remove_dead : function(ele){
		$.each($("#vars textarea"),function(i,val){
			if(!$(val).hasClass("live")){
				$(val).parent().remove();
			}
		});	
	},
    	add_input : function(var_name){
		$(this.el).append('<div class="row"><b>'+var_name+'</b><textarea id="'+var_name+'" class="live"></textarea></div>');
	},
	update : function(e){
		var text = $("#input textarea").val();
		var new_text = "";
		var new_row = "";
		//Didn't seem to work in IE
		//var multi_line_input = text.match(/""[^]+""/g); - added the *
		var multi_line_input = text.match(/""[^*]+""/g);
		var text_rows = text.split(/\r\n|\r|\n/g);
		continued_string = "";
		continued_flag = false;
		continued_start = 0;
		var new_text_rows = [];
		if(multi_line_input){
			for(var i=0;i<text_rows.length;i++){
				var row = text_rows[i];
				var found = false;
				var length = 0;
				$.each(multi_line_input,function(v,multi_line_full){
					var multi_line = multi_line_full.split(/\r\n|\r|\n/g);
					if(row == multi_line[0]){
						found = true;
						length = multi_line.length;
						new_text_rows.push(multi_line_full.substr(2,multi_line_full.length-4));
					}
				});
				if(!found){new_text_rows.push(row);}
				else{i+=length;}
			}
			text_rows = new_text_rows;
		}
		var variables = {};
		$.each($("#vars textarea"),function(i,x){
			//didn't work in IE8
			//variables[$(x).attr("id")] = $(x).val().split(/\r\n|\r|\n/g).filter(function(n){return n});
			//Changed to use jQuery grep method for removing empties
			variables[$(x).attr("id")] = $.grep($(x).val().split(/\r\n|\r|\n/g),function(n){ return(n) });
		});
		$.each(text_rows,function(y,row){
			if(row !== ""){
				new_rows = Array();
				$.each(variables,function(i,variable){
					$.each(variable,function(x,value){
						var regexp = new RegExp("(\\["+i.replace(/_/g," ")+"\\]|<"+i.replace(/_/g," ")+">|\\["+i+"\\]|<"+i+">)",'g');	
						if(new_rows.length <= x){
							new_rows.push(row);
							new_rows[x] = row.replace(regexp,value);
						}else{
							new_rows[x] = new_rows[x].replace(regexp,value);						
						}		
					});
				});
				new_text += new_rows.join("\n")+"\n";
			}
		});
		this.options.parent.output.update(new_text);
	}
});
var OutputView = Backbone.View.extend({
	el : "#output",
	initialize : function(){
		this.clear();
	},
	events : {
	},
    	clear : function(e){
		$("#output textarea").val("");
	},
    	update : function(text){
		$("#output textarea").val(text);
	}
});
var dnote = dnote || {
	init: function(){
		this.noteview = new NoteView();
  	}
};
//site initialization
dnote.init();
Backbone.history.start();
//head.js end 
});
head.js(
{jquery: "assets/js/lib/jquery.min.js"},
{jqueryui: "assets/js/lib/jquery.ui.min.js"},
{underscore: "assets/js/lib/underscore.min.js"},
{backbone: "assets/js/lib/backbone.min.js"}
);
