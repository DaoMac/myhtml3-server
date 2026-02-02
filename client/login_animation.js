window.addEventListener('DOMContentLoaded', () => {
  const loginVideo   = document.getElementById('loginAnimation');
  const waitVideo1   = document.getElementById('waitVideo1');
  const waitVideo2   = document.getElementById('waitVideo2');
  const clickedVideo = document.getElementById('clickedVideo');
  const audioprompt  = document.getElementById('audioPrompt');
  const yesBtn       = document.getElementById('yesBtn');
  const clickDIV     = document.getElementById('clickContainer');
  const waitAudio    = document.getElementById('waittotapAudio');
  const waitAudio1   = document.getElementById('waittotapAudio1');
  const loadingDiv   = document.getElementById('loading-box');

  const allMedia = [loginVideo, waitVideo1, waitVideo2, clickedVideo, waitAudio, waitAudio1];

  // helper promise để đợi media load xong
  function waitMedia(el) {
    return new Promise(resolve => {
      if (el.readyState >= 4) resolve();
      else el.addEventListener('canplaythrough', resolve, { once: true });
    });
  }

  async function init() {
    console.log('Đang chờ tất cả media load...');
    await Promise.all(allMedia.map(waitMedia));
    console.log('Tất cả media đã load xong!');

    loadingDiv.style.display = 'none';
    audioprompt.style.display = 'flex';
    
    startApp();
  }

  function startApp() {
    loginVideo.classList.add('show');
    waitVideo1.classList.remove('show');
    waitVideo2.classList.remove('show');
    clickedVideo.classList.remove('show');
    clickDIV.style.display = 'none';

    waitAudio.pause(); waitAudio.muted = true;
    waitAudio1.pause(); waitAudio1.muted = true;

    const SAFE_TIME = 0.1;
    const SAFE_TIME_AUDIO = 0.2;
    let switching = false;
    let audioSwitching = false;
    let audioUnlocked = false;
    let switchedToWait = false;

    // ========= CORE =========
    function forwardVideo(from, to) {
      if (switching) return;
      if (!from.duration) return;
      if (from.duration - from.currentTime <= SAFE_TIME) {
        switching = true;
        to.currentTime = 0;
        to.play().catch(()=>{});
        from.pause();
        from.classList.remove('show');
        to.classList.add('show');
        setTimeout(()=> switching=false, 300);
      }
    }

    function forwardAudio(from, to) {
      if (audioSwitching) return;
      if (from.duration - from.currentTime <= SAFE_TIME_AUDIO) {
        audioSwitching = true;
        to.currentTime = 0; to.muted = false; to.play().catch(()=>{});
        from.muted = true; from.pause(); from.currentTime = 0;
        setTimeout(()=> audioSwitching=false, 100);
      }
    }

    // ========= WAIT LOOP =========
    waitVideo1.addEventListener('timeupdate', ()=>{ forwardVideo(waitVideo1, waitVideo2); forwardAudio(waitAudio, waitAudio1); });
    waitVideo2.addEventListener('timeupdate', ()=>{ forwardVideo(waitVideo2, waitVideo1); forwardAudio(waitAudio1, waitAudio); });

    // ========= LOGIN → WAIT =========
    function switchToWait() {
      if (switchedToWait) return;
      switchedToWait = true;
      waitAudio.currentTime = 2.1; waitAudio.muted = false;
      clickDIV.style.display = 'block';
      forwardVideo(loginVideo, waitVideo1);
    }

    loginVideo.addEventListener('timeupdate', ()=>{
      if (!loginVideo.duration) return;
      if (loginVideo.duration - loginVideo.currentTime <= 0.1 && audioUnlocked) {
        switchToWait();
        audioUnlocked = false;
      }
    });

    // ========= AUDIO PROMPT =========
    yesBtn.addEventListener('click', ()=>{
      loginVideo.muted = false; loginVideo.play().catch(()=>{});
      audioUnlocked = true;
      waitAudio.muted = true; waitAudio1.muted = true;
      waitAudio.play().catch(()=>{});
      audioprompt.remove();
    });

    // ========= CLICK → FINAL =========
    clickDIV.addEventListener('click', ()=>{
      waitVideo1.classList.remove('show'); waitVideo2.classList.remove('show');
      clickedVideo.classList.add('show'); clickedVideo.currentTime=0; clickedVideo.muted=false; clickedVideo.play();
      clickDIV.remove();
      clickedVideo.addEventListener('ended', ()=>{
        waitAudio.pause(); waitAudio1.pause();
        window.location.href='mainpage.html';
      });
    });
  }

  init();
});
