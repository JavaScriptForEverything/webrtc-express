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
let peerConnection 


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


	// Get mediadevices after getUserMedia() function else device.label will be missing
	getAllDevices() 												

	// Try to Join New User after Media available
	socket.emit('join-room', { roomId }) 		// roomId comes from index.ejs <scrip>


	// WebRTC: Step-1: Creating RTCPeerConnection
	// 	Firefox require TURN server may be it is bug, but in Chrome it works file
	const configuration = {
    // "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
	}
	peerConnection = new RTCPeerConnection(configuration)

	// WebRTC: Step-2: Add all the track to peerConnection instance
	localStream.getTracks().forEach( (track) => {
		peerConnection.addTrack(track)
	})


	// WebRTC: Step-3: Create Offer, passing information to Socket Server (Signaling Server)
	const offer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(offer)

	socket.emit('send-offer', { offer, roomId })


	// WebRTC: Step-6: When both end have there secret in localDescription and other 
	// 	secret into RemoteDescription then 'onicecandidate' event fire will fire.
	// 	make sure this event fire after peerConnection is ready
	peerConnection.addEventListener('icecandidate', (data) => {
		console.log(data)
	})

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




// Socket

socket.on('joined-new-user', () => {
	console.log('New User joined')
})

// WebRTC: Step-4: Receiving Offer, from Socket Server (Signaling Server)
socket.on('receive-offer', async ({ offer }) => {
	await peerConnection.setRemoteDescription(offer)

	const answer = await peerConnection.createAnswer()
	await peerConnection.setLocalDescription(answer)

	socket.emit('send-answer', { answer, roomId})
})


// WebRTC: Step-5: Receiving Answer, from Socket Server (Signaling Server)
socket.on('receive-answer', async ({ answer }) => {
	await peerConnection.setRemoteDescription(answer)
})

