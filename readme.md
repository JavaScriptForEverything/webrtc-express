
## Express + Socket.io + WebRTC + MongoDB

#### Express Server
- express
- socket.io
- mongoDB (mongoose)


#### Share project from Development machine to the world
```
$ yarn add -D localtunnel
$ yarn lt --port 5000 			: Same port server running on development machine
```
- It requred LocalTunnel generated Link from sender.
- It also required sender's Public IP to connect with him via Tunnel



#### Share project from Development machine to the world
```
$ git clone <repo-link>
$ yarn install

$ yarn dev
$ yarn start
$ yarn share
```


#### How WebRTC works
- Required Media Devices
- Required Signaling Server (WebSocket can be used)
- Required TURN server if user use VPN with NAT


To work with WebRTC we need 
- Media Devices from user from `navigator` 

``` Code
	const stream = await navigator.mediaDevices.getUserMedia()
```

To share mediaDevices with each-other over internet, we need A Signaling Server
that share all the required information with each other. That server only need to 
once to create a tunnel between 2 users, once the tunnel created the user can talk
to each other via that tunnel, no need the Signaling server any more, until next 
new connection.

We need 2 more Server according to our need
- STUN Server (Session Trivial Utilities for NAT)
- TURN Server (Trivial Using Relay around NAT)

We are not directly connected with internet, We are under NAT, so no one can connect
from outside of local network to users under NAT.

So To create a connection we need TURN server (very costly) and to send the Session
we can use WebSocket to send our required data for the session. So our Express server
use WebSocket or socket.io can be used as STUN server.

in Development mode:
Firefox failed to create ICE (Internet Connectivity Establishment) without TURN Server,
may be it is FireFox bug, But Chrome browser works fine.

When do we need TURN Server:
Sometime user connected with VPN (Virtual Private Network) with private tunnel, by hiding
self Public IP address, To solve that problem a RELAY created around NAT who act behalf 
Public IP, in that case TURN server we must need, else not.


#### Steps To create a Peer-to-Peer connection via WebSocket

- WebRTC: Step-1: Creating RTCPeerConnection

```
let peerConnection 
...

	// 	Firefox require TURN server may be it is bug, but in Chrome it works file

	const configuration = {
    // "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
	}
	peerConnection = new RTCPeerConnection(configuration)

```


- WebRTC: Step-2: Add all the track to peerConnection instance

```
let localStream 
...
	localStream = await navigator.mediaDevices.getUserMedia(constrain)
	video.srcObject = localStream
	video.autoplay = true

	// WebRTC: Step-2: Add all the track to peerConnection instance
	localStream.getTracks().forEach( (track) => {
		peerConnection.addTrack( track )
	})
```



- WebRTC: Step-3: Create Offer, passing information to Socket Server (Signaling Server)

```
	const offer = await peerConnection.createOffer()
	await peerConnection.setLocalDescription(offer)

	socket.emit('send-offer', { offer, roomId })

```


- WebRTC: Step-4: Receiving Offer, from Socket Server (Signaling Server)
```
socket.on('receive-offer', async ({ offer }) => {
	await peerConnection.setRemoteDescription(offer)

	const answer = await peerConnection.createAnswer()
	await peerConnection.setLocalDescription(answer)

	socket.emit('send-answer', { answer, roomId})
})
```



- WebRTC: Step-5: Receiving Answer, from Socket Server (Signaling Server)
```
socket.on('receive-answer', async ({ answer }) => {
	await peerConnection.setRemoteDescription(answer)
})
```


- WebRTC: Step-6: When both end have there secret in localDescription and other 
	// 	secret into RemoteDescription then 'onicecandidate' event fire will fire.
	// 	make sure this event fire after peerConnection is ready
```
peerConnection.addEventListener('icecandidate', (data) => {
	console.log(data)
})
```


- Server Actions: Listening to evens, and replay events 

```
io.on('connection', (socket) => {

	// join new user to room
	socket.on('join-room', ({ roomId }) => {
		socket.join(roomId)

		socket.to(roomId).emit('joined-new-user')
	})

	socket.on('send-offer', ({ offer, roomId }) => {
		socket.to(roomId).emit('receive-offer', { offer })
	})

	socket.on('send-answer', ({ answer, roomId }) => {
		socket.to(roomId).emit('receive-answer', { answer })
	})

})
```


##### Remember

- For 1st circle of the events

When sending/receiving offer/anser it is 4 steps process circle.
make sure when the first event only send when media devices are ready,
then rest 3 steps can be place any where it dosen't matter, 



- Handle `onicecandidate` event after media ready

When sending/receiving offer/anser circle completed then `onicecandidate`
event fires, so make sure it fire after as the same as as first event of the circle
fires, fire when media devices are ready.


- Store self information into localDescription and other as Remote Description

When create offer store that offer into into localSescription and send that offer 
via WebSocket to remote user.

Remote user get the offer and save that offer into remoteDescription, because
that offer comes from other user for his own pespective. and create an answer
and again save that answer to his localDescription because answer is self data
for his perspective. and send that answer to local user who send the offer to him.

Now offer sender / local user, got answer from other user, so he has to be save that
answer to his RemoteDescription, because answer is others users into prespective of his own.

As soon as the sender save the answer to RemoteDescription both user have one localDescription
and RemoteDescription, which complete the ICE connection and the `onicecandidate` event trigger.

