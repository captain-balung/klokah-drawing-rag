$(function(){
	let dom = $(".level_label");
	if(dom.lengh<0){
		return false;
	}
	console.log("another script start!!");
	let e = {};
	e.dom = dom;
	switch(true){
		case dom.hasClass("lv-e"):
			e.lv = "初級";
			break;
		case dom.hasClass("lv-m"):
			e.lv = "中級";
			break;
		case dom.hasClass("lv-mh"):
			e.lv = "中高級";
			break;
		case dom.hasClass("lv-h"):
			e.lv = "高級";
			break;
		case dom.hasClass("lv-l"):
			e.lv = "優級";
			break;
		default:
			e.lv = "無";
			break;
	}
	level_label = new LevelLabel(e);
})
function LevelLabel(e){
	this.config = e;
	this.initLabel = function() {
		this.dom = this.config.dom;
		this.creatLabel();
	}
	this.creatLabel = function() {
		let dom = this.dom;
		let lv = this.config.lv;
		if(lv!="無"){
			dom.append("<div>"+lv+"</div>");
		}
	}
	this.changeLevel = function(lv) {
		let dom = this.dom;
		dom.attr("class","level_label").empty();
		switch(lv){
			case "初級":
			case "e":
				dom.addClass("lv-e");
				this.config.lv = "初級";
				break;
			case "中級":
			case "m":
				dom.addClass("lv-m");
				this.config.lv = "中級";
				break;
			case "中高級":
			case "mh":
				dom.addClass("lv-mh");
				this.config.lv = "中高級";
				break;
			case "高級":
			case "h":
				dom.addClass("lv-h");
				this.config.lv = "高級";
				break;
			case "優級":
			case "l":
				dom.addClass("lv-l");
				this.config.lv = "優級";
				break;
			default:
				this.config.lv = "無";
				break;
		}
		this.creatLabel();
	}

	this.initLabel();


	this.logLevel = function() {
		console.log(this.config.lv);
	}

}