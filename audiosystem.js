/**
 * Massive thanks to the legend SwankyMan
 * khanacademy.org/profile/kaid_82898098000024228278987/projects
 * 
 * some code stolen from
 * khanacademy.org/cs/-/4567428931633152
**/

PJSCodeInjector.applyInstance = function (o) {
  return function () {
    return Reflect.construct(o, arguments);
  };
};

// Resets audio upon restart
if(typeof source !== 'undefined' && source !== null) {
    try {
        source.stop();
    } catch (e) {}
}
if(typeof context !== 'undefined' && context !== null) {
    try {
        context.close();
    } catch (e) {}
}

var context = new AudioContext();
var source = null;
var audioBuffers = {};
var currentSong = null;
var musicPlaying = false;
var analyser = null;
var dataArray = null;
var beatDetected = false;
var beatThreshold = 200;
var currentBeat = [0, 0], pastBeats = [], beatSize = 0;

function base64ToBuffer (buffer) {
    var binary = window.atob(buffer);
    var buffer = new ArrayBuffer(binary.length);
    var bytes = new Uint8Array(buffer);
    for (var i = 0; i < buffer.byteLength; i++) {
        bytes[i] = binary.charCodeAt(i) & 0xFF;
    }
    return buffer;
}
function initSound_ (name, base64String) {
    var audioFromString = base64ToBuffer(base64String);
    context.decodeAudioData(audioFromString, function (buffer) {
        audioBuffers[name] = buffer;
    }, function (e) {
        console.log('Error decoding file', e);
    });
}
function playSound_ (songName) {
    if(!audioBuffers[songName]) {
        return;
    }
    if(musicPlaying) {
        stopSound_();
    }
    
    // certified yap
    source = context.createBufferSource();
    source.buffer = audioBuffers[songName];
    source.loop = true;
    analyser = context.createAnalyser();
    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);
    analyser.connect(context.destination);
    source.start(0);
    musicPlaying = true;
    currentSong = songName;
}

// asbackup u smol brain aint no way u did this
// ahem read the following 3 functions

function stopSound_() {
    if(source && musicPlaying) {
        source.stop();
        musicPlaying = false;
        source = null;
    }
}
function toggleSound_() {
    if(musicPlaying) {
        stopSound_();
    } else if(currentSong) {
        playSound_(currentSong);
    }
}
function switchSong_(songName) {
    if(currentSong !== songName) {
        playSound_(songName);
    }
}
function sfx_(soundName, volume) {
    if(!audioBuffers[soundName]) {
        return;
    }
    if(volume === undefined) {
        volume = 1;
    }
    volume = constrain(volume, 0, 1);
    var gainNode = context.createGain();
    gainNode.gain.value = volume;
    var sfxSource = context.createBufferSource();
    sfxSource.buffer = audioBuffers[soundName];
    sfxSource.loop = false;
    sfxSource.connect(gainNode);
    gainNode.connect(context.destination);
    sfxSource.start(0);
}
function analyzeBeat_() {
    if(!analyser || !musicPlaying) {
        beatDetected = false;
        return;
    }
    analyser.getByteFrequencyData(dataArray);
    
    
    // 0-5 slots are for bass so we put range to 5
    var bassSum = 0;
    var bassRange = 5;
    
    for(var i = 0; i < bassRange; i++) {
        bassSum += dataArray[i];
    }
    
    var bassAvg = bassSum / bassRange;
    beatDetected = bassAvg > beatThreshold;
    currentBeat[0] = bassSum;
    currentBeat[1] = bassAvg;
}