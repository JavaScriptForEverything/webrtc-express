require('dotenv').config()
const express = require('express')
const path = require('path')
const crypto = require('crypto')
const http = require('http')
const { Server } = require('socket.io')

const publicDir = path.join( process.cwd(), 'public' )

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer)

app.use(express.static(publicDir))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
	res.redirect(`/${crypto.randomUUID()}`)
})

app.get('/:roomId', (req, res) => {
	const { roomId } = req.params

	res.render('index', { 						// => /views/index.ejs
		roomId
	}) 										

})

//------[ socket ]--------

io.on('connection', (socket) => {
	// console.log(socket.id)

	// socket.send(`Hi ${socket.id}`)
	socket.on('join-room', ({ roomId }) => {
		socket.join(roomId)
	})
})

// --------------

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
	console.log(`server start on http://localhost:${PORT} - ${process.env.NODE_ENV}`)
})