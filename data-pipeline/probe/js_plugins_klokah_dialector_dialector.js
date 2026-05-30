function DialectorFull(_dom) {
  this.onChange = function () {};
  this.onClose = function () {};
  this.changeDialect = changeDialect;

  // Dom
  var dom_t;
  var dom_m;
  var dom_b;
  var dom_close;
  var dom_switcher;
  var THIS = this;
  var dom = $(_dom);

  // Event
  var onChange;

  var label = "[Dialector]";

  var languages = [
    { lid: "1", layer: 1, lch: "阿美語" },
    { lid: "2", layer: 1, lch: "泰雅語" },
    { lid: "3", layer: 1, lch: "賽夏語" },
    { lid: "4", layer: 1, lch: "邵語" },
    { lid: "5", layer: 1, lch: "賽德克語" },
    { lid: "6", layer: 1, lch: "布農語" },
    { lid: "7", layer: 1, lch: "排灣語" },
    { lid: "8", layer: 1, lch: "魯凱語" },
    { lid: "9", layer: 2, lch: "太魯閣語" },
    { lid: "10", layer: 2, lch: "噶瑪蘭語" },
    { lid: "11", layer: 2, lch: "鄒語" },
    { lid: "12", layer: 2, lch: "卑南語" },
    { lid: "13", layer: 2, lch: "雅美語" },
    { lid: "14", layer: 2, lch: "撒奇萊雅語" },
    { lid: "15", layer: 2, lch: "卡那卡那富語" },
    { lid: "16", layer: 2, lch: "拉阿魯哇語" },
  ];

  var dialects = [
    { lid: "1", did: "1", lch: "阿美語", dch: "南勢阿美語" },
    { lid: "1", did: "2", lch: "阿美語", dch: "秀姑巒阿美語" },
    { lid: "1", did: "3", lch: "阿美語", dch: "海岸阿美語" },
    { lid: "1", did: "4", lch: "阿美語", dch: "馬蘭阿美語" },
    { lid: "1", did: "5", lch: "阿美語", dch: "恆春阿美語" },
    { lid: "2", did: "6", lch: "泰雅語", dch: "賽考利克泰雅語" },
    { lid: "2", did: "7", lch: "泰雅語", dch: "澤敖利泰雅語" },
    { lid: "2", did: "8", lch: "泰雅語", dch: "汶水泰雅語" },
    { lid: "2", did: "9", lch: "泰雅語", dch: "萬大泰雅語" },
    { lid: "2", did: "10", lch: "泰雅語", dch: "四季泰雅語" },
    { lid: "2", did: "11", lch: "泰雅語", dch: "宜蘭澤敖利泰雅語" },
    { lid: "3", did: "13", lch: "賽夏語", dch: "賽夏語" },
    { lid: "4", did: "14", lch: "邵語", dch: "邵語" },
    { lid: "5", did: "15", lch: "賽德克語", dch: "都達賽德克語" },
    { lid: "5", did: "16", lch: "賽德克語", dch: "德固達雅賽德克語" },
    { lid: "5", did: "17", lch: "賽德克語", dch: "德鹿谷賽德克語" },
    { lid: "6", did: "18", lch: "布農語", dch: "卓群布農語" },
    { lid: "6", did: "19", lch: "布農語", dch: "卡群布農語" },
    { lid: "6", did: "20", lch: "布農語", dch: "丹群布農語" },
    { lid: "6", did: "21", lch: "布農語", dch: "巒群布農語" },
    { lid: "6", did: "22", lch: "布農語", dch: "郡群布農語" },
    { lid: "7", did: "23", lch: "排灣語", dch: "東排灣語" },
    { lid: "7", did: "24", lch: "排灣語", dch: "北排灣語" },
    { lid: "7", did: "25", lch: "排灣語", dch: "中排灣語" },
    { lid: "7", did: "26", lch: "排灣語", dch: "南排灣語" },
    { lid: "8", did: "27", lch: "魯凱語", dch: "東魯凱語" },
    { lid: "8", did: "28", lch: "魯凱語", dch: "霧台魯凱語" },
    { lid: "8", did: "29", lch: "魯凱語", dch: "大武魯凱語" },
    { lid: "8", did: "30", lch: "魯凱語", dch: "多納魯凱語" },
    { lid: "8", did: "31", lch: "魯凱語", dch: "茂林魯凱語" },
    { lid: "8", did: "32", lch: "魯凱語", dch: "萬山魯凱語" },
    { lid: "9", did: "33", lch: "太魯閣語", dch: "太魯閣語" },
    { lid: "10", did: "34", lch: "噶瑪蘭語", dch: "噶瑪蘭語" },
    { lid: "11", did: "35", lch: "鄒語", dch: "鄒語" },
    { lid: "12", did: "38", lch: "卑南語", dch: "南王卑南語" },
    { lid: "12", did: "39", lch: "卑南語", dch: "知本卑南語" },
    { lid: "12", did: "40", lch: "卑南語", dch: "西群卑南語" },
    { lid: "12", did: "41", lch: "卑南語", dch: "建和卑南語" },
    { lid: "13", did: "42", lch: "雅美語", dch: "雅美語" },
    { lid: "14", did: "43", lch: "撒奇萊雅語", dch: "撒奇萊雅語" },
    { lid: "15", did: "36", lch: "卡那卡那富語", dch: "卡那卡那富語" },
    { lid: "16", did: "37", lch: "拉阿魯哇語", dch: "拉阿魯哇語" },
  ];

  init();

  function init() {
    var html = "";

    html += '<div class="t">';
    html += '	<div class="icon"></div>';
    html += '	<div class="title">您尚未選擇語言</div>';
    html += '	<div class="switcher"></div>';
    html += '	<div class="close"></div>';
    html += "</div>";

    if (md.mobile() == null) {
      //桌電
      html += '<div class="m">';
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += "</div>";
    } else if (md.mobile() != null && md.tablet() == null) {
      //手機
      html += '<div class="m">';
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += "</div>";
    } // 平板
    else {
      html += '<div class="m">';
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += "</div>";
    }
    html += '<div class="b"></div>';

    dom = $(_dom);
    dom.append(html);

    dom_t = dom.children(".t");
    dom_m = dom.children(".m");
    dom_b = dom.children(".b");
    dom_data = dom_t.children(".data");
    dom_close = dom_t.children(".close");
    dom_switcher = dom_t.children(".switcher");
    dom.removeClass("open").addClass("dialector");

    for (var i in languages) {
      var lid = languages[i].lid;
      var lch = languages[i].lch;
      if (md.mobile() == null) {
        //桌電
        var idx_layer = i < 8 ? 0 : 1;
      } else if (md.mobile() != null && md.tablet() == null) {
        //手機
        if (i < 2) {
          var idx_layer = 0;
        } else if (i < 4) {
          var idx_layer = 1;
        } else if (i < 6) {
          var idx_layer = 2;
        } else if (i < 8) {
          var idx_layer = 3;
        } else if (i < 10) {
          var idx_layer = 4;
        } else if (i < 12) {
          var idx_layer = 5;
        } else if (i < 14) {
          var idx_layer = 6;
        } else if (i < 16) {
          var idx_layer = 7;
        }
      } // 平板
      else {
        if (i < 4) {
          var idx_layer = 0;
        } else if (i < 8) {
          var idx_layer = 1;
        } else if (i < 12) {
          var idx_layer = 2;
        } else if (i < 16) {
          var idx_layer = 3;
        }
      }
      var dom_l =
        '<a class="language" lid="' +
        lid +
        '" lch="' +
        lch +
        '">' +
        lch +
        "</a>";
      dom_m.find(".layer .ls").eq(idx_layer).append(dom_l);
    }
    dom_close.click(onCloseDialectList);
    dom_switcher.click(onOpenDialectList);
    $(".dialector .dialect").click(onDialectSelected);
    $(".dialector .language").click(onLanguageSelected);

    if (prefer.did != "") {
      dom_t.children(".title").html("目前語言：" + prefer.dch);
    }
  }
  function onCloseDialectList() {
    dom.removeClass("open");
    THIS.onClose();
  }
  function onOpenDialectList() {
    clearDialects();
    dom.toggleClass("open");
  }
  function onDialectSelected() {
    var d;
    var did = $(this).attr("did");

    for (var i in dialects) {
      var did_2 = dialects[i].did;
      d = did == did_2 ? dialects[i] : d;
    }
    if (d == undefined) {
      console.error(label + " 查無此方言");
      return;
    }

    dom.removeClass("open");
    dom.find(".language").removeClass("selected");
    dom_t.children(".title").html("目前語言：" + d.dch);

    // Update
    $.post(
      path.web + "member/set_prefer_dialect.php",
      { did: did },
      onSuccess
    );
    function onSuccess(msg) {
      //var href = klokah.replaceQuery(window.location.href,'d',did);
      var url = new URL(window.location.href);
      url.remove("d");
      console.log(typeof url.qString);
      if (typeof keepQueryString !== 'undefined' && keepQueryString === true && url.qString != "") {
        window.location.href = url.fileName + "?" + url.qString;
      } else {
        window.location.href = url.fileName;
      }
    }
  }
  function onLanguageSelected() {
    var l;
    var lid = $(this).attr("lid");
    var ds = $(this).parent().siblings(".ds");

    for (var i in languages) {
      var lid_2 = languages[i].lid;
      l = lid == lid_2 ? lid : l;
    }
    if (l == undefined) {
      console.error(label + " 查無此語言");
      return;
    }

    clearDialects();
    $(this).addClass("selected");
    for (var i in dialects) {
      if (dialects[i].lid == lid) {
        var did = dialects[i].did;
        var dch = dialects[i].dch;
        var dom_d =
          '<a class="dialect" did="' +
          did +
          '" dch="' +
          dch +
          '">' +
          dch +
          "</a>";
        ds.append(dom_d);
      }
    }
    $(".dialector .dialect").click(onDialectSelected);
    if (ds.find(".dialect").length == 1) {
      ds.find(".dialect").click();
    }
  }
  function clearDialects() {
    dom.find(".ds").html("");
    dom.find(".language").removeClass("selected");
  }
  function changeDialect(did) {
    var d;
    for (var i in dialects) {
      var did_2 = dialects[i].did;
      d = did == did_2 ? dialects[i] : d;
    }
    if (d == undefined) {
      console.error(label + " 查無此方言");
      return;
    }
    dom_t.children(".title").html("目前語言：" + d.dch);
    return d;
  }
}

function DialectorSimple(_dom) {
  var dom = $(_dom);
  var dom_l;
  var dom_d;

  var languages = [
    { lid: "1", layer: 1, lch: "阿美語" },
    { lid: "2", layer: 1, lch: "泰雅語" },
    { lid: "3", layer: 1, lch: "賽夏語" },
    { lid: "4", layer: 1, lch: "邵語" },
    { lid: "5", layer: 1, lch: "賽德克語" },
    { lid: "6", layer: 1, lch: "布農語" },
    { lid: "7", layer: 1, lch: "排灣語" },
    { lid: "8", layer: 1, lch: "魯凱語" },
    { lid: "9", layer: 2, lch: "太魯閣語" },
    { lid: "10", layer: 2, lch: "噶瑪蘭語" },
    { lid: "11", layer: 2, lch: "鄒語" },
    { lid: "12", layer: 2, lch: "卑南語" },
    { lid: "13", layer: 2, lch: "雅美語" },
    { lid: "14", layer: 2, lch: "撒奇萊雅語" },
    { lid: "15", layer: 2, lch: "卡那卡那富語" },
    { lid: "16", layer: 2, lch: "拉阿魯哇語" },
  ];

  var dialects = [
    { lid: "1", did: "1", lch: "阿美語", dch: "南勢阿美語" },
    { lid: "1", did: "2", lch: "阿美語", dch: "秀姑巒阿美語" },
    { lid: "1", did: "3", lch: "阿美語", dch: "海岸阿美語" },
    { lid: "1", did: "4", lch: "阿美語", dch: "馬蘭阿美語" },
    { lid: "1", did: "5", lch: "阿美語", dch: "恆春阿美語" },
    { lid: "2", did: "6", lch: "泰雅語", dch: "賽考利克泰雅語" },
    { lid: "2", did: "7", lch: "泰雅語", dch: "澤敖利泰雅語" },
    { lid: "2", did: "8", lch: "泰雅語", dch: "汶水泰雅語" },
    { lid: "2", did: "9", lch: "泰雅語", dch: "萬大泰雅語" },
    { lid: "2", did: "10", lch: "泰雅語", dch: "四季泰雅語" },
    { lid: "2", did: "11", lch: "泰雅語", dch: "宜蘭澤敖利泰雅語" },
    { lid: "3", did: "13", lch: "賽夏語", dch: "賽夏語" },
    { lid: "4", did: "14", lch: "邵語", dch: "邵語" },
    { lid: "5", did: "15", lch: "賽德克語", dch: "都達賽德克語" },
    { lid: "5", did: "16", lch: "賽德克語", dch: "德固達雅賽德克語" },
    { lid: "5", did: "17", lch: "賽德克語", dch: "德鹿谷賽德克語" },
    { lid: "6", did: "18", lch: "布農語", dch: "卓群布農語" },
    { lid: "6", did: "19", lch: "布農語", dch: "卡群布農語" },
    { lid: "6", did: "20", lch: "布農語", dch: "丹群布農語" },
    { lid: "6", did: "21", lch: "布農語", dch: "巒群布農語" },
    { lid: "6", did: "22", lch: "布農語", dch: "郡群布農語" },
    { lid: "7", did: "23", lch: "排灣語", dch: "東排灣語" },
    { lid: "7", did: "24", lch: "排灣語", dch: "北排灣語" },
    { lid: "7", did: "25", lch: "排灣語", dch: "中排灣語" },
    { lid: "7", did: "26", lch: "排灣語", dch: "南排灣語" },
    { lid: "8", did: "27", lch: "魯凱語", dch: "東魯凱語" },
    { lid: "8", did: "28", lch: "魯凱語", dch: "霧台魯凱語" },
    { lid: "8", did: "29", lch: "魯凱語", dch: "大武魯凱語" },
    { lid: "8", did: "30", lch: "魯凱語", dch: "多納魯凱語" },
    { lid: "8", did: "31", lch: "魯凱語", dch: "茂林魯凱語" },
    { lid: "8", did: "32", lch: "魯凱語", dch: "萬山魯凱語" },
    { lid: "9", did: "33", lch: "太魯閣語", dch: "太魯閣語" },
    { lid: "10", did: "34", lch: "噶瑪蘭語", dch: "噶瑪蘭語" },
    { lid: "11", did: "35", lch: "鄒語", dch: "鄒語" },
    { lid: "12", did: "38", lch: "卑南語", dch: "南王卑南語" },
    { lid: "12", did: "39", lch: "卑南語", dch: "知本卑南語" },
    { lid: "12", did: "40", lch: "卑南語", dch: "西群卑南語" },
    { lid: "12", did: "41", lch: "卑南語", dch: "建和卑南語" },
    { lid: "13", did: "42", lch: "雅美語", dch: "雅美語" },
    { lid: "14", did: "43", lch: "撒奇萊雅語", dch: "撒奇萊雅語" },
    { lid: "15", did: "36", lch: "卡那卡那富語", dch: "卡那卡那富語" },
    { lid: "16", did: "37", lch: "拉阿魯哇語", dch: "拉阿魯哇語" },
  ];

  init();

  function init() {
    var html = '<select class="language">';
    html += "<option>請選擇語言</option>";

    for (var l in languages) {
      html +=
        '<option label="' +
        languages[l].lch +
        '" value="' +
        languages[l].lid +
        '"' +
        (languages[l].lid == prefer.lid ? "selected" : "") +
        ">" +
        languages[l].lch +
        "</option>";
    }

    html += "</select>";
    html += '<select class="dialect">';
    html += "<option>請選擇方言</option>";
    html += "</select>";

    dom.append(html);
    dom_d = dom.children("select.dialect");
    dom_l = dom.children("select.language");
    dom_d.change(onDialectSelected);
    dom_l.change(onLanguageSelected).change();
  }
  function onDialectSelected() {
    var did = dom_d.val();
  }
  function onLanguageSelected() {
    dom_d.html("<option>請選擇方言</option>");
    var lid = dom_l.val();
    for (var d in dialects) {
      if (dialects[d].lid == lid) {
        var option =
          '<option lid="' +
          dialects[d].lid +
          '" label="' +
          dialects[d].dch +
          '" value="' +
          dialects[d].did +
          '"' +
          (dialects[d].did == prefer.did ? "selected" : "") +
          ">" +
          dialects[d].dch +
          "</option>";
        $(dom_d).append(option);
      }
    }
    $(dom_d).change();
  }
}

function DialectorLite(_dom) {
  this.onChange = function () {};
  this.onClose = function () {};

  // Dom
  var dom_t;
  var dom_m;
  var dom_b;
  var dom_close;
  var dom_switcher;
  var THIS = this;
  var dom = $(_dom);

  // Event
  var onChange;

  var label = "[Dialector]";

  var languages = [
    { lid: "1", layer: 1, lch: "阿美語" },
    { lid: "2", layer: 1, lch: "泰雅語" },
    { lid: "3", layer: 1, lch: "賽夏語" },
    { lid: "4", layer: 1, lch: "邵語" },
    { lid: "5", layer: 1, lch: "賽德克語" },
    { lid: "6", layer: 1, lch: "布農語" },
    { lid: "7", layer: 1, lch: "排灣語" },
    { lid: "8", layer: 1, lch: "魯凱語" },
    { lid: "9", layer: 2, lch: "太魯閣語" },
    { lid: "10", layer: 2, lch: "噶瑪蘭語" },
    { lid: "11", layer: 2, lch: "鄒語" },
    { lid: "12", layer: 2, lch: "卑南語" },
    { lid: "13", layer: 2, lch: "雅美語" },
    { lid: "14", layer: 2, lch: "撒奇萊雅語" },
    { lid: "15", layer: 2, lch: "卡那卡那富語" },
    { lid: "16", layer: 2, lch: "拉阿魯哇語" },
  ];

  var dialects = [
    { lid: "1", did: "1", lch: "阿美語", dch: "南勢阿美語" },
    { lid: "1", did: "2", lch: "阿美語", dch: "秀姑巒阿美語" },
    { lid: "1", did: "3", lch: "阿美語", dch: "海岸阿美語" },
    { lid: "1", did: "4", lch: "阿美語", dch: "馬蘭阿美語" },
    { lid: "1", did: "5", lch: "阿美語", dch: "恆春阿美語" },
    { lid: "2", did: "6", lch: "泰雅語", dch: "賽考利克泰雅語" },
    { lid: "2", did: "7", lch: "泰雅語", dch: "澤敖利泰雅語" },
    { lid: "2", did: "8", lch: "泰雅語", dch: "汶水泰雅語" },
    { lid: "2", did: "9", lch: "泰雅語", dch: "萬大泰雅語" },
    { lid: "2", did: "10", lch: "泰雅語", dch: "四季泰雅語" },
    { lid: "2", did: "11", lch: "泰雅語", dch: "宜蘭澤敖利泰雅語" },
    { lid: "3", did: "13", lch: "賽夏語", dch: "賽夏語" },
    { lid: "4", did: "14", lch: "邵語", dch: "邵語" },
    { lid: "5", did: "15", lch: "賽德克語", dch: "都達賽德克語" },
    { lid: "5", did: "16", lch: "賽德克語", dch: "德固達雅賽德克語" },
    { lid: "5", did: "17", lch: "賽德克語", dch: "德鹿谷賽德克語" },
    { lid: "6", did: "18", lch: "布農語", dch: "卓群布農語" },
    { lid: "6", did: "19", lch: "布農語", dch: "卡群布農語" },
    { lid: "6", did: "20", lch: "布農語", dch: "丹群布農語" },
    { lid: "6", did: "21", lch: "布農語", dch: "巒群布農語" },
    { lid: "6", did: "22", lch: "布農語", dch: "郡群布農語" },
    { lid: "7", did: "23", lch: "排灣語", dch: "東排灣語" },
    { lid: "7", did: "24", lch: "排灣語", dch: "北排灣語" },
    { lid: "7", did: "25", lch: "排灣語", dch: "中排灣語" },
    { lid: "7", did: "26", lch: "排灣語", dch: "南排灣語" },
    { lid: "8", did: "27", lch: "魯凱語", dch: "東魯凱語" },
    { lid: "8", did: "28", lch: "魯凱語", dch: "霧台魯凱語" },
    { lid: "8", did: "29", lch: "魯凱語", dch: "大武魯凱語" },
    { lid: "8", did: "30", lch: "魯凱語", dch: "多納魯凱語" },
    { lid: "8", did: "31", lch: "魯凱語", dch: "茂林魯凱語" },
    { lid: "8", did: "32", lch: "魯凱語", dch: "萬山魯凱語" },
    { lid: "9", did: "33", lch: "太魯閣語", dch: "太魯閣語" },
    { lid: "10", did: "34", lch: "噶瑪蘭語", dch: "噶瑪蘭語" },
    { lid: "11", did: "35", lch: "鄒語", dch: "鄒語" },
    { lid: "12", did: "38", lch: "卑南語", dch: "南王卑南語" },
    { lid: "12", did: "39", lch: "卑南語", dch: "知本卑南語" },
    { lid: "12", did: "40", lch: "卑南語", dch: "西群卑南語" },
    { lid: "12", did: "41", lch: "卑南語", dch: "建和卑南語" },
    { lid: "13", did: "42", lch: "雅美語", dch: "雅美語" },
    { lid: "14", did: "43", lch: "撒奇萊雅語", dch: "撒奇萊雅語" },
    { lid: "15", did: "36", lch: "卡那卡那富語", dch: "卡那卡那富語" },
    { lid: "16", did: "37", lch: "拉阿魯哇語", dch: "拉阿魯哇語" },
  ];

  init();

  function init() {
    var html = "";
    html += '<div class="t dropdown">';
    html += '	<div class="icon"></div>';
    html += '	<div class="title">您尚未選擇語言</div>';
    html += '	<div class="switcher"></div>';
    html += '	<div class="close"></div>';
    html += "</div>";
    if (md.mobile() == null) {
      //桌電
      html += '<div class="m">';
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += "</div>";
    } else if (md.mobile() != null && md.tablet() == null) {
      //手機
      html += '<div class="m">';
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += "</div>";
    } // 平板
    else {
      html += '<div class="m">';
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += '	<div class="layer">';
      html += '		<div class="ls"></div>';
      html += '		<div class="ds"></div>';
      html += "	</div>";
      html += "</div>";
    }
    html += '<div class="b"></div>';

    dom = $(_dom);
    dom.append(html);

    dom_t = dom.children(".t");
    dom_m = dom.children(".m");
    dom_b = dom.children(".b");
    dom_data = dom_t.children(".data");
    dom_close = dom_t.children(".close");
    dom_switcher = dom_t.children(".switcher");
    dom.removeClass("open").addClass("dialector");

    for (var i in languages) {
      var lid = languages[i].lid;
      var lch = languages[i].lch;
      if (md.mobile() == null) {
        //桌電
        var idx_layer = i < 8 ? 0 : 1;
      } else if (md.mobile() != null && md.tablet() == null) {
        //手機
        if (i < 2) {
          var idx_layer = 0;
        } else if (i < 4) {
          var idx_layer = 1;
        } else if (i < 6) {
          var idx_layer = 2;
        } else if (i < 8) {
          var idx_layer = 3;
        } else if (i < 10) {
          var idx_layer = 4;
        } else if (i < 12) {
          var idx_layer = 5;
        } else if (i < 14) {
          var idx_layer = 6;
        } else if (i < 16) {
          var idx_layer = 7;
        }
      } // 平板
      else {
        if (i < 4) {
          var idx_layer = 0;
        } else if (i < 8) {
          var idx_layer = 1;
        } else if (i < 12) {
          var idx_layer = 2;
        } else if (i < 16) {
          var idx_layer = 3;
        }
      }
      var dom_l =
        '<a class="language" lid="' +
        lid +
        '" lch="' +
        lch +
        '">' +
        lch +
        "</a>";
      dom_m.find(".layer .ls").eq(idx_layer).append(dom_l);
    }
    dom_close.click(onCloseDialectList);
    dom_switcher.click(onOpenDialectList);
    $(".dialector .language").click(onLanguageSelected);

    if (prefer.lid != "") {
      dom_t.children(".title").html("目前語言：" + prefer.lch);
    }
  }
  function onCloseDialectList() {
    dom.removeClass("open");
  }
  function onOpenDialectList() {
    dom.toggleClass("open");
  }
  function onLanguageSelected() {
    var l;
    var lid = $(this).attr("lid");
    var ds = $(this).parent().siblings(".ds");

    for (var i in languages) {
      var lid_2 = languages[i].lid;
      l = lid == lid_2 ? lid : l;
    }
    if (l == undefined) {
      console.error(label + " 查無此語言");
      return;
    }

    for (var i in dialects) {
      if (dialects[i].lid == lid) {
        var did = dialects[i].did;
        var dch = dialects[i].dch;
        break;
      }
    }

    // Update
    $.post(path.web + "member/set_prefer_dialect.php", { did: did }, onSuccess);
    function onSuccess(msg) {
      //var href = klokah.replaceQuery(window.location.href,'d',did);
      var url = new URL(window.location.href);
      url.remove("d");
      window.location.replace(url.fileName);
    }
  }
}

function DialectorDropdown(_dom) {

  var dom = $(_dom);
  var languages = [
    { lid: "1", layer: 1, lch: "阿美語" },
    { lid: "2", layer: 1, lch: "泰雅語" },
    { lid: "3", layer: 1, lch: "賽夏語" },
    { lid: "4", layer: 1, lch: "邵語" },
    { lid: "5", layer: 1, lch: "賽德克語" },
    { lid: "6", layer: 1, lch: "布農語" },
    { lid: "7", layer: 1, lch: "排灣語" },
    { lid: "8", layer: 1, lch: "魯凱語" },
    { lid: "9", layer: 2, lch: "太魯閣語" },
    { lid: "10", layer: 2, lch: "噶瑪蘭語" },
    { lid: "11", layer: 2, lch: "鄒語" },
    { lid: "12", layer: 2, lch: "卑南語" },
    { lid: "13", layer: 2, lch: "雅美語" },
    { lid: "14", layer: 2, lch: "撒奇萊雅語" },
    { lid: "15", layer: 2, lch: "卡那卡那富語" },
    { lid: "16", layer: 2, lch: "拉阿魯哇語" },
  ];

  var dialects = [
    { lid: "1", did: "1", lch: "阿美語", dch: "南勢阿美語" },
    { lid: "1", did: "2", lch: "阿美語", dch: "秀姑巒阿美語" },
    { lid: "1", did: "3", lch: "阿美語", dch: "海岸阿美語" },
    { lid: "1", did: "4", lch: "阿美語", dch: "馬蘭阿美語" },
    { lid: "1", did: "5", lch: "阿美語", dch: "恆春阿美語" },
    { lid: "2", did: "6", lch: "泰雅語", dch: "賽考利克泰雅語" },
    { lid: "2", did: "7", lch: "泰雅語", dch: "澤敖利泰雅語" },
    { lid: "2", did: "8", lch: "泰雅語", dch: "汶水泰雅語" },
    { lid: "2", did: "9", lch: "泰雅語", dch: "萬大泰雅語" },
    { lid: "2", did: "10", lch: "泰雅語", dch: "四季泰雅語" },
    { lid: "2", did: "11", lch: "泰雅語", dch: "宜蘭澤敖利泰雅語" },
    { lid: "3", did: "13", lch: "賽夏語", dch: "賽夏語" },
    { lid: "4", did: "14", lch: "邵語", dch: "邵語" },
    { lid: "5", did: "15", lch: "賽德克語", dch: "都達賽德克語" },
    { lid: "5", did: "16", lch: "賽德克語", dch: "德固達雅賽德克語" },
    { lid: "5", did: "17", lch: "賽德克語", dch: "德鹿谷賽德克語" },
    { lid: "6", did: "18", lch: "布農語", dch: "卓群布農語" },
    { lid: "6", did: "19", lch: "布農語", dch: "卡群布農語" },
    { lid: "6", did: "20", lch: "布農語", dch: "丹群布農語" },
    { lid: "6", did: "21", lch: "布農語", dch: "巒群布農語" },
    { lid: "6", did: "22", lch: "布農語", dch: "郡群布農語" },
    { lid: "7", did: "23", lch: "排灣語", dch: "東排灣語" },
    { lid: "7", did: "24", lch: "排灣語", dch: "北排灣語" },
    { lid: "7", did: "25", lch: "排灣語", dch: "中排灣語" },
    { lid: "7", did: "26", lch: "排灣語", dch: "南排灣語" },
    { lid: "8", did: "27", lch: "魯凱語", dch: "東魯凱語" },
    { lid: "8", did: "28", lch: "魯凱語", dch: "霧台魯凱語" },
    { lid: "8", did: "29", lch: "魯凱語", dch: "大武魯凱語" },
    { lid: "8", did: "30", lch: "魯凱語", dch: "多納魯凱語" },
    { lid: "8", did: "31", lch: "魯凱語", dch: "茂林魯凱語" },
    { lid: "8", did: "32", lch: "魯凱語", dch: "萬山魯凱語" },
    { lid: "9", did: "33", lch: "太魯閣語", dch: "太魯閣語" },
    { lid: "10", did: "34", lch: "噶瑪蘭語", dch: "噶瑪蘭語" },
    { lid: "11", did: "35", lch: "鄒語", dch: "鄒語" },
    { lid: "12", did: "38", lch: "卑南語", dch: "南王卑南語" },
    { lid: "12", did: "39", lch: "卑南語", dch: "知本卑南語" },
    { lid: "12", did: "40", lch: "卑南語", dch: "西群卑南語" },
    { lid: "12", did: "41", lch: "卑南語", dch: "建和卑南語" },
    { lid: "13", did: "42", lch: "雅美語", dch: "雅美語" },
    { lid: "14", did: "43", lch: "撒奇萊雅語", dch: "撒奇萊雅語" },
    { lid: "15", did: "36", lch: "卡那卡那富語", dch: "卡那卡那富語" },
    { lid: "16", did: "37", lch: "拉阿魯哇語", dch: "拉阿魯哇語" },
  ];

  init();

  function init() {
    var html = "";

    html +=
      '	<div class="dBox"><div id="dropdownToggle"><div id="dropdownText"></div><div class="dropdownArrow"><img src="img/triangle.png"/></div></div>';
      html +='<div id="d_menu" class="menu"/>';
    html += '</div>';
    
    
  
    dom = $(_dom);
    dom.append(html);

    var menu = $("#d_menu");
    var dBox = $(".dBox");

    $.each(languages, function(index, language) {
        var matchingDialects = $.grep(dialects, function(dialect) {
            return dialect.lid === language.lid;
        });
    
        if (matchingDialects.length === 1) {
            var dialect = matchingDialects[0];
            var newDiv = $('<div class="language"></div>')
                .attr('did', dialect.did)
                .text(dialect.dch);
            menu.append(newDiv);
        }else if(matchingDialects.length > 1){
          var dialect = matchingDialects[0];
            var newDiv = $('<div class="language menu-item"></div>')
                .attr('data-lid', dialect.lid)
                .text(dialect.lch);
            menu.append(newDiv);

            var submenu = $('<div></div>')
            .attr('id', 'submenu' + language.lid)
            .addClass('submenu language');
        
        $.each(matchingDialects, function(i, dialect) {
            var submenuItem = $('<div></div>')
                .addClass('submenu-item language')
                .attr('did', dialect.did)
                .text(dialect.dch);
            submenu.append(submenuItem);
        });

        dBox.append(submenu);
        }
    });
	dom_open = dom.find("#dropdownToggle");

    $("#dropdownToggle").click(function () {
      onOpenDropdown();
    });
    

    var submenuTimeout;

    $('#menu-button').on('click', function() {
        $('#d_menu').toggle();
        $('.submenu').hide();
    });

    $('.menu-item').hover(function() {
        clearTimeout(submenuTimeout);
        var submenuId = $(this).data('lid');
        console.log('submenuId :>> ', submenuId);
        $('.submenu').hide();
        $('#submenu' + submenuId).show().css({
            top: $(this).position().top+30,
        });
    }, function() {
      var submenuId = $(this).data('lid');
        submenuTimeout = setTimeout(function() {
            if (!$('#submenu' + submenuId).is(':hover')) {
                $('#submenu' + submenuId).hide();
            }
        }, 200);
    });

    $('.submenu').hover(function() {
        clearTimeout(submenuTimeout);
        $(this).show();
    }, function() {
        $(this).hide();
    });

    $('#d_menu').mouseleave(function() {
        $('.submenu').hide();
    });

    

    $(".language").click(function () {
      var did = $(this).attr("did");
	    var lch = $(this).attr("lch");
      $("#dropdownText").html(lch);
      if (did) {
        $.post(
          path.web + "member/set_prefer_dialect.php",
          { did: did },
          onSuccess
        );
      }
      function onSuccess(msg) {
        //var href = klokah.replaceQuery(window.location.href,'d',did);
        var url = new URL(window.location.href);
        url.remove("d");
        if (typeof keepQueryString !== 'undefined' && keepQueryString === true) {
          window.location.href = url.fileName + "?" + url.qString;
        } else {
          window.location.href = url.fileName;
        }
      }
    });

    $(document).on('click', function(event) {
      if (!$(event.target).closest('#d_menu, #dropdownToggle').length) {
        $('#d_menu').removeClass('show');
        $('.dropdownArrow img').removeClass('rotate-90').addClass('rotate-0');
          $('.submenu').hide();
      }
  });
    if (prefer.did != "") {
      $("#dropdownText").html(prefer.dch);
    }
  }
  
  let isOpen = false;
  function onOpenDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      $('#d_menu').addClass('show');
      $('.dropdownArrow img').removeClass('rotate-0').addClass('rotate-90');
    } else {
      $('#d_menu').removeClass('show');
      $('.dropdownArrow img').removeClass('rotate-90').addClass('rotate-0');
    }
  }
  


 
}
