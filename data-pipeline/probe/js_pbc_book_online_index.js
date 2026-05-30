$(document).ready(function () {
  var bookManager = {
    book: null,
    page: {
      scale: 1,
      now: 0,
      max: 0
    },
    isAutoPlaying: false,
    bookAudioURL: '',
    bookChAudioURL: ''
  };
  const book_audio_root = 'https://web.klokah.tw/text/sound/';
  var autoPlayTimer; // 自動播放計時器
  const TIMEOUT_DURATION = 2000; // 可配置的超時時間

  function configurePlayerControls() {
    let controls = [
      'play',
      'progress',
      'current-time',
      // 'mute', 
      // 'volume',
    ];

    if (window.innerWidth > 768) {
      controls = [
        'play-large',
        'restart',
        'rewind',
        'play',
        'fast-forward',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
      ];
    }

    // 重新初始化播放器
    window.player = new Plyr("audio", {
      i18n: {
        restart: '重播',
        rewind: '倒帶 10 秒',
        play: '播放',
        pause: '暫停',
        fastForward: '快轉 10 秒',
        seek: '尋找',
        played: '已播放',
        buffered: '緩衝',
        currentTime: '目前時間',
        duration: '總共時間',
        volume: '音量',
        mute: '靜音',
        unmute: '取消靜音',
        enableCaptions: '開啟內嵌字幕',
        disableCaptions: '關閉內嵌字幕',
        enterFullscreen: '全螢幕',
        exitFullscreen: '退出全螢幕',
        frameTitle: '{title} 播放器',
        captions: '內嵌字幕',
        settings: '設定',
        speed: '播放速率',
        normal: '一般',
        quality: '畫質',
        loop: '循還播放',
        start: '開始',
        end: '結束',
        all: '全部',
        reset: '重置',
        disabled: '關閉',
        advertisement: '廣告',
      },
      controls: controls
    });
  }

  configurePlayerControls();
  $(window).resize(debounce(configurePlayerControls, 300));

  // 重複播放按鈕相關邏輯
  const replayButton = $('#replay-button');
  // 初始化重複播放按鈕事件
  if (replayButton) {
    replayButton.hide();
    replayButton.on('click', function () {
      player.play();
      // replayButton.hide();
    });
  }

  // 使用 Plyr 播放器的事件系統來監聽播放結束事件
  player.on('ended', function () {
    console.log('ended', bookManager.page.now, bookManager.page.max);
    // 只有當不是自動播放模式，且當前頁不是最後一頁時，才顯示重複播放按鈕
    if (!bookManager.isAutoPlaying && replayButton) {
      replayButton.show();
    }
  });

  get_book(lid);
  var mainHeight;
  var windowHeight = $(window).height();
  var toolbarHeight = $('.tool-bar').height();
  var timeout;

  // 防抖函數 (debounce)
  function debounce(func, wait = 200) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function hideNavBarAndFooter() {
    if (!isMobileDevice() && isLandscape()) { // 只在桌面版橫式隱藏
      $('.navbar').slideUp();
      $('.tool-bar').slideUp();
    }
    $('#ebook img').css('max-height', '100vh');
    $('#ebook img').css('height', '100vh');
  }

  function showNavBarAndFooter(position) {
    const landscape = isLandscape(); // 快取 isLandscape 的結果

    if (position == "top") {
      if (!$('.navbar').is(':visible')) { // 檢查是否已顯示
        $('.navbar').slideDown(200);
      }
    }
    else if (position == "bottom") {
      if (!$('.tool-bar').is(':visible')) { // 檢查是否已顯示
        $('.tool-bar').slideDown(200);
      }
    }
    if (landscape) {
      $('#ebook img').css('max-height', '100vh');
      $('#ebook img').css('height', '100vh');
    }
  }

  $(document).keydown(function (e) {
    switch (e.which) {
      case 37:
      case 38:
        on_prev_page();
        break;
      case 39:
      case 40:
        on_next_page();
        break;
      case 32:
        e.preventDefault();
        if (player.playing) {
          player.pause();
        } else {
          player.play();
        }
        break;
      default: return;
    }
    e.preventDefault();
  });

  function setSubtitleHeight() {
    mainHeight = $('#main').outerHeight(true);
    windowHeight = $(window).height();

    if (!isLandscape()) {
      var subtitleHeight = windowHeight - mainHeight - toolbarHeight;
      subtitleHeight = subtitleHeight > 0 ? subtitleHeight : 0;
      $('#subtitle').css('height', subtitleHeight);
    } else {
      $('#subtitle').css('height', '');
    }
  }

  function resetTimer(position) {
    clearTimeout(timeout);

    const landscape = isLandscape();
    // 更精確地處理行動裝置的情況
    if (isMobileDevice() && window.innerWidth <= 768) {
      // 只處理行動裝置的情況
      if (landscape) {
        showLandscapeOverlay();
      } else {
        hideLandscapeOverlay();
      }
      showNavBarAndFooter(position);
    } else {
      // 處理桌面裝置的情況
      hideLandscapeOverlay(); // 確保桌面環境不顯示 overlay

      if (landscape) {
        // 桌面裝置且橫向時執行
        showNavBarAndFooter(position);
        showArrow();
        timeout = setTimeout(hideNavBarAndFooter, TIMEOUT_DURATION);
      } else {
        // 桌面裝置但非橫向
        showNavBarAndFooter(position);
        timeout = setTimeout(hideArrow, TIMEOUT_DURATION);
      }
    }
  }

  function showArrow() {
    $('.page-nav').show();
  }

  function hideArrow() {
    $('.page-nav').hide();
  }

  // $('body').on('click touchstart mousemove', function () {
  //   resetTimer();
  // });
  $(document).on('mousemove touchstart', debounce(function (e) {
    // 獲取螢幕高度
    const screenHeight = $(window).height();
    const topThreshold = screenHeight * 0.1;       // 上方 10% 高度
    const bottomThreshold = screenHeight * 0.8;    // 下方 20% 高度

    // 獲取滑鼠或觸控點的 Y 座標
    let y = e.clientY || 0; // 預設滑鼠事件座標，若無則預設為 0
    if (e.type === 'touchstart') {
      y = e.touches[0].clientY; // 若是觸控事件，取第一個觸控點的座標
    }
    // console.log('y:', y, 'top:', topThreshold, 'bottom:', bottomThreshold);
    // 判斷是否位於上方10% 或下方 20% 範圍內
    if (y <= topThreshold) {
      resetTimer("top");
    }
    else if (y >= bottomThreshold) {
      resetTimer("bottom");
    }
  }, 100));

  $(window).resize(debounce(function () {
    resetTimer();
    reload_page();
  }, 300));

  resetTimer();

  $('.audio_change').on('click', reload_page);

  function get_book(lid) {
    $.get('get_data.php', {
      id: id,
      lid: lid
    }).done(on_done).fail(on_fail);

    function on_done(msg) {
      bookManager.book = $.parseJSON(msg);
      bookManager.page.max = bookManager.book?.pages ? Object.keys(bookManager.book.pages).length : 0;

      if (bookManager.page.max === 0) {
        $('#ebook').hide();
      } else {
        init();
      }
    }

    function on_fail(msg) {
      console.log(msg);
    }

    function init() {
      $('#toggle_subtitle_ch').click(on_toggle_subtitle_ch);
      $('#toggle_subtitle_ab').click(on_toggle_subtitle_ab);
      $('#prev').click(on_prev_page);
      $('#next').click(on_next_page);
      $('.page-nav.left').click(on_prev_page);
      $('.page-nav.right').click(on_next_page);
      $('#auto-play').click(on_auto_play);
      player.on('ended', function () {
        if (!bookManager.isAutoPlaying) replayButton.show();
      });
      reload_page();
      if ($('.audio_change:checked').attr('id') !== 'ch-audio') {
        player.source = {
          type: 'audio',
          sources: [{ src: book_audio_root + bookManager.bookAudioURL + '.mp3', type: 'audio/mp3' }]
        };
      } else {
        player.source = {
          type: 'audio',
          sources: [{ src: book_audio_root + bookManager.bookChAudioURL + '.mp3', type: 'audio/mp3' }]
        };
      }
    }
  }

  function on_toggle_subtitle_ab() {
    var is_hide = $('#toggle_subtitle_ab').hasClass('hide');
    $('#subtitle .ab').toggleClass('hide');
    $('#toggle_subtitle_ab').toggleClass('hide');
    $('#toggle_subtitle_ab').html(is_hide ? '族語<i class="fa-solid fa-eye"></i>' : '族語<i class="fa-solid fa-eye-slash"></i>');
  }

  function on_toggle_subtitle_ch() {
    var is_hide = $('#toggle_subtitle_ch').hasClass('hide');
    $('#subtitle .ch').toggleClass('hide');
    $('#toggle_subtitle_ch').toggleClass('hide');
    $('#toggle_subtitle_ch').html(is_hide ? '華語<i class="fa-solid fa-eye"></i>' : '華語<i class="fa-solid fa-eye-slash"></i>');
  }

  function on_prev_page() {
    bookManager.page.now--;
    reload_page();
  }

  function on_next_page() {
    bookManager.page.now++;
    reload_page();
  }

  function reload_page() {
    console.log("bookManager.isAutoPlaying", bookManager.isAutoPlaying);
    // 隱藏重複播放按鈕
    if (replayButton) {
      replayButton.hide();
    }
    bookManager.page.now = Math.max(1, Math.min(bookManager.page.now, bookManager.page.max));

    var currentPage = bookManager.book.pages[bookManager.page.now] || {};

    var src = bookManager.book ? 'https://web.klokah.tw/pbc/book/' + bookManager.book.id + '/' + currentPage.no + '.jpg' : '';
    loadAndSetImage(src);
    $('#subtitle>.ab').html(currentPage.ab || '');
    $('#subtitle>.ch').html(currentPage.ch || '');
    $('#subtitle').scrollTop(0);

    $('#prev, #next').removeAttr('disabled').removeClass('disabled');
    $('#prev-sm, #next-sm').css('visibility', 'visible');
    $('#prev-sm>.tooltip-text').html('前往第' + '' + (bookManager.page.now - 1) + '頁');
    $('#next-sm>.tooltip-text').html('前往第' + '' + (bookManager.page.now + 1) + '頁');
    if (bookManager.page.now === 1) {
      $('#prev').attr('disabled', '').addClass('disabled');
      $('#prev-sm').css('visibility', 'hidden');
    }
    if (bookManager.page.now === bookManager.page.max) {
      $('#next').attr('disabled', '').addClass('disabled');
      $('#next-sm').css('visibility', 'hidden');
    }

    bookManager.bookAudioURL = currentPage.audio_url;
    bookManager.bookChAudioURL = currentPage.audio_ch_url;
    var audio_track = $('.audio_change:checked').attr('id');
    var audioSrc = (audio_track !== 'ch-audio') ? bookManager.bookAudioURL : bookManager.bookChAudioURL;

    // 解除已註冊事件，避免重複
    clearTimeout(autoPlayTimer);
    player.off('ended', goNextPage);

    // 設定音源
    if (audioSrc) {
      player.source = {
        type: 'audio',
        sources: [{ src: book_audio_root + audioSrc + '.mp3', type: 'audio/mp3' }]
      };
      // 音檔載入就自動播放（無論自動播放或手動翻頁都會自動撥放）
      player.once('loadeddata', function () {
        player.play();
      });
    } else {
      player.source = {
        type: 'audio',
        sources: []
      };
    }

    if (bookManager.isAutoPlaying) {
      if (audioSrc) {
        // 有音檔時：等音檔播完再翻頁
        player.once('ended', goNextPage);
      } else {
        // 沒音檔時：3 秒後自動換頁
        autoPlayTimer = setTimeout(goNextPage, 3000);
      }
    }
  }

  function goNextPage() {
    if (!bookManager.isAutoPlaying) {
      return;
    }
    console.log("bookManager.isAutoPlaying", bookManager.isAutoPlaying);
    if (bookManager.page.now < bookManager.page.max) {
      bookManager.page.now++;
      // 再次檢查是否超出最大頁數
      if (bookManager.page.now <= bookManager.page.max) {
        reload_page();
      } else {
        // 如果跳過後超出最大頁數，也視為播放結束
        bookManager.isAutoPlaying = false;
        $('#auto-play').html('自動播放<i class="fa-regular fa-circle-play"></i>');
        if (replayButton) {
          replayButton.show(); // 在最後一頁結束時顯示重播
        }
      }
    } else {
      // 已經是最後一頁，自動播放結束
      console.log("Reached the last page during auto-play."); // 添加日誌
      bookManager.isAutoPlaying = false;
      $('#auto-play').html('自動播放<i class="fa-regular fa-circle-play"></i>');
      // （可選）在最後一頁自動播放結束時顯示重播按鈕
      if (replayButton) {
        replayButton.show();
      }
    }
  }

  function loadAndSetImage(src) {
    var img = $('#ebook>img');
    img.attr('src', src).on('load', function () {
      mainHeight = $('#main').outerHeight(true);
      setSubtitleHeight();
    });
  }

  $('#toggle-subtitle-btn').click(function () {
    var isExpanded = $('#subtitle').is(':visible');
    if (isExpanded) {
      $('#subtitle').hide();
      $('#toggle-subtitle-btn').html('<i class="fas fa-chevron-up"></i>');
    } else {
      $('#subtitle').show();
      $('#toggle-subtitle-btn').html('<i class="fas fa-chevron-down"></i>');
    }
  });

  $('[data-toggle="tooltip"]').tooltip();

  function toggleSubtitleBtn() {
    var $btn = $('#toggle-subtitle-btn');
    var isHidden = $btn.hasClass('active');
    if (isHidden) {
      $btn.removeClass('active').find('i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
      $btn.attr('data-original-title', '隱藏文字');
    } else {
      $btn.addClass('active').find('i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
      $btn.attr('data-original-title', '顯示文字');
    }
    $btn.tooltip('dispose').tooltip();
  }

  $('#toggle-subtitle-btn').click(toggleSubtitleBtn);

  function showLandscapeOverlay() {
    if (bookManager.isAutoPlaying) {
      player.pause();
      $('#auto-play').html('自動<span class="d-none d-md-inline">播放</span><i class="fa-regular fa-circle-play"></i>');
      bookManager.isAutoPlaying = false;
    }
    $('#landscape-overlay').show();
  }

  function hideLandscapeOverlay() {
    $('#landscape-overlay').hide();
  }

  function on_auto_play() {
    bookManager.isAutoPlaying = !bookManager.isAutoPlaying;
    $('#auto-play').html(bookManager.isAutoPlaying ? '停止播放<i class="fa-regular fa-circle-pause"></i>' : '自動播放<i class="fa-regular fa-circle-play"></i>');

    if (!bookManager.isAutoPlaying) {
      clearTimeout(autoPlayTimer);
      player.off('ended', goNextPage);
    }
    else {
      reload_page();
    }
  }
});
