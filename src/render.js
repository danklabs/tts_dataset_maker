const {dialog} = require('electron').remote;
const remote = require('electron').remote;
const fs = require('fs');
const toWav = require('audiobuffer-to-wav');
var shell = require('shelljs');
const cryptoRandomString = require('crypto-random-string');

let files;
let selectedDirectory;
let destDirectory;
let currentSelection = 0;
let projectName;


var wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#ff914d',
    progressColor: 'white',
    responsive: true,
    plugins: [
        WaveSurfer.regions.create({}),
        // WaveSurfer.timeline.create({})
      ]
});

document.querySelector("#projectNameBtn").addEventListener('click', function(event){
    projectName = document.getElementById("ProjInput").value;
    if (projectName !== ""){
        document.getElementById("nameInputSection").style.display = 'none';
        document.getElementById("folderSelection").style.display = 'inline';
    }else{
        alert_err("Please enter a project name");
    }
});

document.querySelector('#selectFolderBtn').addEventListener('click', function (event) {
    let options = {properties:["openDirectory"]};
    let dir = dialog.showOpenDialogSync(options);
    selectedDirectory = dir[0];
    let exists = false;
    files = fs.readdirSync(selectedDirectory);
    files.forEach(file => {
        if (file.includes(".wav") || file.includes(".mp3") ){
            exists = true;
            return ;
        }
    });
    if (exists === true){
        
        document.getElementById("selectDestFolderBtn").disabled = false;
        document.getElementById("folderLink").style.display = "inline";
        document.getElementById("folderLink").innerHTML = selectedDirectory;
    }else{
        alert_err("No audio files were found in that folder.");
    }
        

});

document.querySelector("#selectDestFolderBtn").addEventListener('click', function (event) {
    let options = {properties:["openDirectory"]};
    let dir = dialog.showOpenDialogSync(options);
    if (!fs.existsSync(dir[0]+"/"+projectName+"/wavs/")) {
        shell.mkdir('-p', dir[0]+"/"+projectName+"/wavs/");
    }
    destDirectory = dir[0];
    document.getElementById("proceedBtn").style.display = "inline";
    document.getElementById("destFolderLink").style.display = "inline";
    document.getElementById("destFolderLink").innerHTML = destDirectory;
});

document.querySelector("#proceedBtn").addEventListener('click', function(event){
   
    document.getElementById("selectPage").style.display = 'none';
    document.getElementById("mainPage").style.display = 'inline';
    wavesurfer.load(selectedDirectory+"/"+files[currentSelection]);
    fs.closeSync(fs.openSync(destDirectory+"/"+projectName+"/metadata.csv", 'w'));
    
});

document.querySelector('#playPauseBtn').addEventListener('click', function (event) {
    if (wavesurfer.isPlaying()){
        document.getElementById("playPauseBtn").innerHTML = "Play";
    }else{
        document.getElementById("playPauseBtn").innerHTML = "Pause";
    }
    wavesurfer.playPause();
});


document.querySelector('#loopBtn').addEventListener('click', function (event) {
    let begin = wavesurfer.regions.list["main"].start;
    let end = wavesurfer.regions.list["main"].end;
    
    if (wavesurfer.isPlaying()){
        document.getElementById("playPauseBtn").innerHTML = "Play";
        
        wavesurfer.pause()
    }else{
        document.getElementById("playPauseBtn").innerHTML = "Pause";

        wavesurfer.play(parseFloat(begin), parseFloat(end));
    }
});


document.querySelector('#useClipBtn').addEventListener('click', function (event) {
    setloading(true);
    let text = document.getElementById("tts").value;
    if (text !== ""){
        let begin = parseFloat(wavesurfer.regions.list["main"].start);
        let end = parseFloat(wavesurfer.regions.list["main"].end);
        begin = Math.round(begin );
        end = Math.round(end );
        // console.log(begin);
        // console.log(end);
        let cut_clip = cut({"start":begin, "end":end}, wavesurfer);
        let wav = toWav(cut_clip.cutSelection); 
        var chunk = new Uint8Array(wav);
        const rand = cryptoRandomString({length: 5, type: 'url-safe'});
        let fileName = destDirectory+"/"+projectName+"/wavs/"+projectName+"-"+rand+".wav";
        fs.writeFile(fileName, new Buffer(chunk), function (err) {
            console.log(err);
        });
        let content = fs.readFileSync(destDirectory+"/"+projectName+"/metadata.csv");
        if (content != ""){
            content = content + "\n" + projectName+"-"+rand+"|"+text
        }else{
            content = projectName+"-"+rand+"|"+text
        }
        
        fs.writeFileSync(destDirectory+"/"+projectName+"/metadata.csv",  content, "UTF-8",{'flags': 'a+'});       
        document.getElementById("tts").value="";
        add_to_table(projectName+"-"+rand,text);


    } else{
        alert("You cant leave the text area blank!!");
    }
    setloading(false);


});

document.querySelector("#prev").addEventListener('click', function(event){
    if(currentSelection !== 0){
        currentSelection = currentSelection -1;
        wavesurfer.destroy();
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#ff914d',
            progressColor: 'white',
            responsive: true,
            plugins: [
                WaveSurfer.regions.create({}),
                // WaveSurfer.timeline.create({})
              ]
        });
        if (wavesurfer.enableDragSelection) {
            region = wavesurfer.addRegion({
                id: "main",
                start: 5,
                end: 5 + 5,
                resize: true,
                drag: true,
                loop: false,
                color: 'rgba(255,255,255, 0.5)'
            });
        }
        wavesurfer.load(selectedDirectory+"/"+files[currentSelection]);
        if ((currentSelection-1) > 0){document.getElementById("prev").disabled = false;}
        else{document.getElementById("prev").disabled = true;}
        if ((currentSelection+1) <= files.length-1){document.getElementById("next").disabled = false;}

    }else{
        console.log("error")
    }
});

document.querySelector("#next").addEventListener('click', function(event){
    if(currentSelection < files.length-1){
        currentSelection = currentSelection +1;
        wavesurfer.destroy();
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#ff914d',
            progressColor: 'white',
            responsive: true,
            plugins: [
                WaveSurfer.regions.create({}),
                // WaveSurfer.timeline.create({})
              ]
        });
        if (wavesurfer.enableDragSelection) {
            region = wavesurfer.addRegion({
                id: "main",
                start: 5,
                end: 5 + 5,
                resize: true,
                drag: true,
                loop: false,
                color: 'rgba(255,255,255, 0.5)'
            });
        }
        wavesurfer.load(selectedDirectory+"/"+files[currentSelection]);
        if ((currentSelection+1) > files.length-1){document.getElementById("next").disabled = true;}
        if ((currentSelection-1) > -1){document.getElementById("prev").disabled = false;}
    }else{
        console.log("error")
    }
});

document.querySelector("#del").addEventListener('click', function (event){
    document.getElementById("error").style.display ='none';
});

document.querySelector("#finishBtn").addEventListener('click', function (event){
    let w = remote.getCurrentWindow()
    w.close()

});

wavesurfer.on('ready', function () {
    if (wavesurfer.enableDragSelection) {
        region = wavesurfer.addRegion({
          id: "main",
          start: 5,
          end: 5 + 5,
          resize: true,
          drag: true,
          loop: false,
          color: 'rgba(255,255,255, 0.5)'
        });
    }
});




var Btn = document.getElementById("playPauseBtn");

document.onkeydown = function (e) {
    if (e.keyCode == 32) {
        Btn.click();
    }
};

function add_to_table(fname, txt){
    document.getElementById("listbox").style.display = "inline";
    document.getElementById("tableBod").innerHTML = document.getElementById("tableBod").innerHTML + "<tr><td>"+fname+"</td><td>"+txt+"</td></tr>";
}


function cut(params,instance){
    /*
    ---------------------------------------------
    The function will take the buffer used to create the waveform and will
    create
    a new blob with the selected area from the original blob using the
    offlineAudioContext
    */

    // var self = this;
    var start = params.start;
    var end = params.end;

    var originalAudioBuffer = instance.backend.buffer;

    var lengthInSamples = Math.floor( (end - start) * originalAudioBuffer.sampleRate );
    if (! window.OfflineAudioContext) {
        if (! window.webkitOfflineAudioContext) {
            // $('#output').append('failed : no audiocontext found, change browser');
            alert('webkit context not found')
        }
        window.OfflineAudioContext = window.webkitOfflineAudioContext;
    }
    // var offlineAudioContext = new OfflineAudioContext(1, 2,originalAudioBuffer.sampleRate );
    var offlineAudioContext = instance.backend.ac

    var emptySegment = offlineAudioContext.createBuffer(
        originalAudioBuffer.numberOfChannels,
        lengthInSamples,
        originalAudioBuffer.sampleRate );

    var newAudioBuffer = offlineAudioContext.createBuffer(
        originalAudioBuffer.numberOfChannels,
        (start === 0 ? (originalAudioBuffer.length - emptySegment.length) :originalAudioBuffer.length),
        originalAudioBuffer.sampleRate);

    for (var channel = 0; channel < originalAudioBuffer.numberOfChannels;channel++) {

        var new_channel_data = newAudioBuffer.getChannelData(channel);
        var empty_segment_data = emptySegment.getChannelData(channel);
        var original_channel_data = originalAudioBuffer.getChannelData(channel);

        var before_data = original_channel_data.subarray(0, start * originalAudioBuffer.sampleRate);
        var mid_data = original_channel_data.subarray( start * originalAudioBuffer.sampleRate, end * originalAudioBuffer.sampleRate);
        var after_data = original_channel_data.subarray(Math.floor(end * originalAudioBuffer.sampleRate), (originalAudioBuffer.length * originalAudioBuffer.sampleRate));

        empty_segment_data.set(mid_data);
        if(start > 0){
            new_channel_data.set(before_data);
            new_channel_data.set(after_data,(start * newAudioBuffer.sampleRate));
        } else {
            new_channel_data.set(after_data);
        }
    }
    return {
        newAudioBuffer,
        cutSelection:emptySegment
    }

}

function alert_err(msg){
    document.getElementById("content").innerHTML = msg;
    document.getElementById("error").style.display = "inline";
}

function setloading(yno){
    if(yno){
        document.getElementById("useClipBtn").classList.add("is-loading");
    }
    else{
        document.getElementById("useClipBtn").classList.remove("is-loading");
    }
}
//event to continue playing from where cursor is clicked
// wavesurfer.on('seek', function(e){
//     let dur = wavesurfer.getDuration();
//     wavesurfer.play(parseFloat(e*dur));  
// });
