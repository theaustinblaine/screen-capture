//Buttons
const videoElement = document.querySelector('video')

const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const videoSelectionBtn = document.getElementById('videoSelectionBtn')
videoSelectionBtn.onclick = getVideoSources


const {desktopCapturer, remote} = require('electron')
const {Menu} = remote

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];
//Get the available video sources

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return{
                label: source.name,
                click: () => selectSource(source)
            }
        })
    )

    videoOptionsMenu.popup()
}

// Change the videoSource window to record
async function selectSource(source) {
    videoSelectionBtn.innerText = source.name

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    }
    // Create a stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    videoElement.srcObject = stream
    videoElement.play()

    //Create the Media recorder
    const options =  {mimeType: 'video/webm; codecs=vp9'}
    let mediaRecorder = new mediaRecorder(stream, options)

    //Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop
}

function handleDataAvailable(e) {
    console.log('video data available')
    recordedChunks.push(e.data)
}

const {dialog} = remote
const {writeFile} = require('fs')

//Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer())

    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    console.log(filePath)
    
    writeFile(filePath, buffer, () => console.log('Video saved successfully!'))
}

startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
};