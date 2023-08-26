const video = document.getElementById('video')
const muteBtn = document.getElementById('muteBtn')
const cameraBtn = document.getElementById('cameraBtn')
const selectCam = document.getElementById('selectCam')
const selectMicrophone = document.getElementById('selectMicrophone')
const screenShareBtn = document.getElementById('screenShareBtn')

const demo = document.getElementById('demo')

const socket = io() 		// will be available because of <script src='/socket.io/socket.io.js'>



let localStream = new MediaStream()
let isMuted = false 
let isCameraOn = false 


const populateOption = (device, type, parentElement) => {
	// while( parentElement.firstChild ) {
	// 	parentElement.removeChild( parentElement.firstChild )
	// }

	const option = document.createElement('option')
	option.value = device.deviceId
	option.textContent = device.label

	const selectedTrack = type === 'videoinput' 
		?  localStream.getVideoTracks()[0] 
		: localStream.getAudioTracks()[0]
	option.selected = device.label === selectedTrack.label

	// parentElement.replaceChild(option)
	parentElement.appendChild(option)
}

const getAllDevices = async () => {
	const allDevices = await navigator.mediaDevices.enumerateDevices()

	allDevices.forEach( (device) => {
		if(device.kind === 'videoinput') {
			populateOption(device, 'videoinput', selectCam)
		}
		if(device.kind === 'audioinput') {
			populateOption(device, 'audioinput', selectMicrophone)
		}
	})
}


const getMedia = async ({ cameraId = '', microphoneId = '' } = {}) => {

	const constrain = { 
		audio:  microphoneId 	? { deviceId: microphoneId } 	: true,
		video: cameraId 			? { deviceId: cameraId } 			: true
	}

	localStream = await navigator.mediaDevices.getUserMedia(constrain)
	video.srcObject = localStream
	video.autoplay = true

	// Disable Sound on load
	localStream.getAudioTracks().forEach( (track) => track.enabled = false)

	getAllDevices()
	socket.emit('join-room', { roomId }) 		// comes from index.ejs <scrip>
}

getMedia()



// Audio handler
muteBtn.addEventListener('click', (evt) => {

	if( isMuted ) {
		muteBtn.textContent = 'Mute'
		isMuted = false

		localStream.getAudioTracks().forEach( (track) => {
			track.enabled = true
		})

	} else {
		muteBtn.textContent = 'Unmute'
		isMuted = true

		localStream.getAudioTracks().forEach( (track) => {
			track.enabled = false
		})
	}
})


// Video handler
cameraBtn.addEventListener('click', (evt) => {
	if(isCameraOn) {
		cameraBtn.textContent = 'Turn Camera OFF'
		isCameraOn = false
		localStream.getVideoTracks().forEach( (track) => {
			track.enabled = true
		})

	} else {
		cameraBtn.textContent = 'Turn Camera ON'
		isCameraOn = true
		localStream.getVideoTracks().forEach( (track) => {
			track.enabled = false
		})
	}
})


selectCam.addEventListener('input', (evt) => {
	// pass new camera value, plus old microphoneId too
	getMedia({ cameraId: evt.target.value, microphoneId: selectMicrophone.value })

	// To Empty everything and all one option
	while (selectCam.firstChild) {
		selectCam.removeChild(selectCam.firstChild)
	}

	const option = document.createElement('option')
	option.disabled = true
	option.selected = true
	option.textContent = 'Select WebCam'

	selectCam.appendChild(option)
})


selectMicrophone.addEventListener('input', (evt) => {
	// pass new camera value, plus old microphoneId too
	getMedia({ microphoneId: evt.target.value, cameraId: selectCam.value })

	// To Empty everything and all one option
	while (selectMicrophone.firstChild) {
		selectMicrophone.removeChild(selectMicrophone.firstChild)
	}

	const option = document.createElement('option')
	option.disabled = true
	option.selected = true
	option.textContent = 'Select Microphone'

	selectMicrophone.appendChild(option)
})



const screenVideo = document.getElementById('screen')

screenShareBtn.addEventListener('click', async () => {
	const shareStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
	console.log(shareStream)

	screenVideo.srcObject = shareStream
	screenVideo.autoplay = true
	screenVideo.play()

})





