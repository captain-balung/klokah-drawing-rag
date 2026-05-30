var player;
var dialector;
var path = {};
var prefer = { lid:'', lch:'', did:'',dch:'' };
var klokah = new Klokah();
var md;
var bufferDid = 0;
$(document).ready(function()
{
	md = new MobileDetect(window.navigator.userAgent);
	console.log( md.mobile() );          // 行動裝置廠牌'Sony'
	console.log( md.phone() );           // 手機廠牌'Sony'
	console.log( md.tablet() );          // 平板廠牌null
	console.log( md.userAgent() );       // 瀏覽器'Safari'
	console.log( md.os() );              // 作業系統'AndroidOS'
	console.log( md.is('iPhone') );      // 是否為iphone false
	console.log( md.is('bot') );         // false
	console.log( md.version('Webkit') );         // 534.3
	console.log( md.versionStr('Build') );       // '4.1.A.0.562'
	console.log( md.match('playstation|xbox') ); // false
	getPath();
	getPreferDid();
	// window.fbAsyncInit = function() {
	// 				    FB.init({
	// 				      appId      : '1101647696541758',
	// 				      xfbml      : true,
	// 				      version    : 'v2.5'
	// 				    });
	// 				  };
	// 				  (function(d, s, id){
	// 				     var js, fjs = d.getElementsByTagName(s)[0];
	// 				     if (d.getElementById(id)) {return;}
	// 				     js = d.createElement(s); js.id = id;
	// 				     js.src = "//connect.facebook.net/en_US/sdk.js";
	// 				     fjs.parentNode.insertBefore(js, fjs);
	// 				   }(document, 'script', 'facebook-jssdk'));
	function getPath()
	{
		var isLH = document.domain == 'localhost' ? 'localhost/project/' : '';
		path.klokah  = 'https://' + isLH + 'klokah.tw/';
		path.web     = 'https://' + isLH + 'web.klokah.tw/';
		path.test    = 'https://' + isLH + 'test.klokah.tw/';
		path.file    = 'https://' + isLH + 'file.klokah.tw/';
		path.lokahsu = 'https://' + isLH + 'lokahsu.org.tw/';
	}
	function getPreferDid()
	{
		var languages = [
		{ lid :  '1' , layer : 1 , lch : '阿美語' },
		{ lid :  '2' , layer : 1 , lch : '泰雅語' },
		{ lid :  '3' , layer : 1 , lch : '賽夏語' },
		{ lid :  '4' , layer : 1 , lch : '邵語' },
		{ lid :  '5' , layer : 1 , lch : '賽德克語' },
		{ lid :  '6' , layer : 1 , lch : '布農語' },
		{ lid :  '7' , layer : 1 , lch : '排灣語' },
		{ lid :  '8' , layer : 1 , lch : '魯凱語' },
		{ lid :  '9' , layer : 2 , lch : '太魯閣語' },
		{ lid : '10' , layer : 2 , lch : '噶瑪蘭語' },
		{ lid : '11' , layer : 2 , lch : '鄒語' },
		{ lid : '12' , layer : 2 , lch : '卑南語' },
		{ lid : '13' , layer : 2 , lch : '雅美語' },
		{ lid : '14' , layer : 2 , lch : '撒奇萊雅語' },
		{ lid : '15' , layer : 2 , lch : '卡那卡那富語' },
		{ lid : '16' , layer : 2 , lch : '拉阿魯哇語' }];
		
		var dialects = [
		{ lid :  '1' , did :  '1' , lch : '阿美語' , dch : '南勢阿美語' },
		{ lid :  '1' , did :  '2' , lch : '阿美語' , dch : '秀姑巒阿美語' },
		{ lid :  '1' , did :  '3' , lch : '阿美語' , dch : '海岸阿美語' },
		{ lid :  '1' , did :  '4' , lch : '阿美語' , dch : '馬蘭阿美語' },
		{ lid :  '1' , did :  '5' , lch : '阿美語' , dch : '恆春阿美語' },
		{ lid :  '2' , did :  '6' , lch : '泰雅語' , dch : '賽考利克泰雅語' },
		{ lid :  '2' , did :  '7' , lch : '泰雅語' , dch : '澤敖利泰雅語' },
		{ lid :  '2' , did :  '8' , lch : '泰雅語' , dch : '汶水泰雅語' },
		{ lid :  '2' , did :  '9' , lch : '泰雅語' , dch : '萬大泰雅語' },
		{ lid :  '2' , did : '10' , lch : '泰雅語' , dch : '四季泰雅語' },
		{ lid :  '2' , did : '11' , lch : '泰雅語' , dch : '宜蘭澤敖利泰雅語' },
		{ lid :  '3' , did : '13' , lch : '賽夏語' , dch : '賽夏語' },
		{ lid :  '4' , did : '14' , lch : '邵語' , dch : '邵語' },
		{ lid :  '5' , did : '15' , lch : '賽德克語' , dch : '都達賽德克語' },
		{ lid :  '5' , did : '16' , lch : '賽德克語' , dch : '德固達雅賽德克語' },
		{ lid :  '5' , did : '17' , lch : '賽德克語' , dch : '德鹿谷賽德克語' },
		{ lid :  '6' , did : '18' , lch : '布農語' , dch : '卓群布農語' },
		{ lid :  '6' , did : '19' , lch : '布農語' , dch : '卡群布農語' },
		{ lid :  '6' , did : '20' , lch : '布農語' , dch : '丹群布農語' },
		{ lid :  '6' , did : '21' , lch : '布農語' , dch : '巒群布農語' },
		{ lid :  '6' , did : '22' , lch : '布農語' , dch : '郡群布農語' },
		{ lid :  '7' , did : '23' , lch : '排灣語' , dch : '東排灣語' },
		{ lid :  '7' , did : '24' , lch : '排灣語' , dch : '北排灣語' },
		{ lid :  '7' , did : '25' , lch : '排灣語' , dch : '中排灣語' },
		{ lid :  '7' , did : '26' , lch : '排灣語' , dch : '南排灣語' },
		{ lid :  '8' , did : '27' , lch : '魯凱語' , dch : '東魯凱語' },
		{ lid :  '8' , did : '28' , lch : '魯凱語' , dch : '霧台魯凱語' },
		{ lid :  '8' , did : '29' , lch : '魯凱語' , dch : '大武魯凱語' },
		{ lid :  '8' , did : '30' , lch : '魯凱語' , dch : '多納魯凱語' },
		{ lid :  '8' , did : '31' , lch : '魯凱語' , dch : '茂林魯凱語' },
		{ lid :  '8' , did : '32' , lch : '魯凱語' , dch : '萬山魯凱語' },
		{ lid :  '9' , did : '33' , lch : '太魯閣語' , dch : '太魯閣語' },
		{ lid : '10' , did : '34' , lch : '噶瑪蘭語' , dch : '噶瑪蘭語' },
		{ lid : '11' , did : '35' , lch : '鄒語' , dch : '鄒語' },
		{ lid : '12' , did : '38' , lch : '卑南語' , dch : '南王卑南語' },
		{ lid : '12' , did : '39' , lch : '卑南語' , dch : '知本卑南語' },
		{ lid : '12' , did : '40' , lch : '卑南語' , dch : '西群卑南語' },
		{ lid : '12' , did : '41' , lch : '卑南語' , dch : '建和卑南語' },
		{ lid : '13' , did : '42' , lch : '雅美語' , dch : '雅美語' },
		{ lid : '14' , did : '43' , lch : '撒奇萊雅語' , dch : '撒奇萊雅語' },
		{ lid : '15' , did : '36' , lch : '卡那卡那富語' , dch : '卡那卡那富語' },
		{ lid : '16' , did : '37' , lch : '拉阿魯哇語' , dch : '拉阿魯哇語' }];
	
		$.post(path.web + 'member/get_prefer_dialect.php',{refer: window.location.href},onSuccess);
		function onSuccess(msg)
		{
			var data = $.parseJSON(msg);
			// klokah.prefer.did = data.did;
			prefer.did = data.did;
			
			for(var i in dialects)
			{
				var d = dialects[i];
				if ( d.did == prefer.did)
				{
					prefer.lid = d.lid;
					prefer.lch = d.lch;
					prefer.did = d.did;
					prefer.dch = d.dch;
				}
			}
			klokah.prefer = prefer;
			$.each($('.dialector'),onDialector);
		}
	}
	function onDialector()
	{
		if($(this).hasClass('simple'))
		{
			dialector = new DialectorSimple(this);
		}
		else if($(this).hasClass('lite')){
			dialector = new DialectorLite(this);
		}
		else if($(this).hasClass('dropdown')){
			dialector = new DialectorDropdown(this);
		}
		else
		{
			dialector = new DialectorFull(this);
			if(bufferDid > 0){
				dialector.changeDialect(bufferDid);
			}
		}
	}
});
function Klokah()
{
	this.prefer = { lid:'', lch:'', did:'',dch:'' };
	this.playSound = function(_url)
	{
		soundManager.stopAll();
		player = soundManager.createSound({ url: _url});
		player.play();
	}
	this.stopSound = function()
	{
		soundManager.stopAll();
	}
	this.shareToFacebook = function(data)
	{
		/*
		var sharer  = "https://www.facebook.com/sharer/sharer.php?s=100";
		var images  = "&p[images][0]=" + "http://klokah.tw/member/avatar/default.jpg";
		var summary = "&p[summary]="   + data.summary;
		var title   = "&p[title]="     + data.title;
	 	var url     = "&p[url]="       + data.url; 
		var fb_url = sharer + url + images + title + summary;
		window.open (fb_url,"_blank");
		*/
		
		
		// 275831649207579
		// 177426032409310
		// 460377210723148
			
		
		var sharer       = "https://www.facebook.com/dialog/feed?app_id=275831649207579&display=popup";
		var caption      = '&caption=' + data.caption + '';
		var link         = '&link=' + data.link + '';
		var picture      = '&picture=http://klokah.tw/member/avatar/default.jpg';
		var name         = '&name=' + data.name + '';
		var description  = '&description=' + data.description + '';
		var redirect_uri = '&redirect_uri=' + data.redirect_uri + '';
		var fb_url = sharer + caption + link + picture + name + description+redirect_uri;
		window.open (fb_url,"_blank");
	}
}