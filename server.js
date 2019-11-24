const express = require('express')
const bodyParser = require('body-parser')
const { resolve } = require('path')
const webpush = require('web-push')
const os = require('os')
const EventEmitter = require('events')
const ngrok = require('ngrok')
 
// ⚠ SEE https://www.npmjs.com/package/web-push
const publicVapidKey = 'BOV4vnqYSiDkUbo7k-q4up2CCSv-kXBYY7BLAV3Xx4dVOXNJU-HvWzp2YuwzSC-EDMq2DZQjotejqZedlekLK8s'
const privateVapidKey = 'h1NDqWTpuruioPUF82BVidkByzgWUJIRK1eyjE6st08'
webpush.setVapidDetails('mailto:iagob26@gmail.com', publicVapidKey, privateVapidKey)

const app = express()
app.use(bodyParser.json())
app.use(express.static(resolve(__dirname, 'public')))
const port = 3000
let url;


const user = {
  username: 'admin',
  password: 'admin',
  passwordlessLoginIsEnabled: false,
  pushSubscriptionRef: undefined,
}

const loginRequests = []
// [{
//   id: 1,
//   status: 'pending' | 'allowed' | 'blocked' | 'expired' | 'canceled',
//   browser: 'Chrome',
//   operationalSystem: 'Windows 10',
//   createdAt: Date.now(),
// }]

class MyEmitter extends EventEmitter {}
const loginRequestResponses = new MyEmitter()
 

app.get('/check-username', (req, res) => {
  if (user.username === req.query.username) {
    res.send({
      status: 'user_exists',
      passwordlessLoginIsEnabled: user.passwordlessLoginIsEnabled
    })
  } else {
    res.send({
      status: 'unregistered_user'
    })
  }
})

app.post('/sign-in', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) return res.sendStatus(400)

  if (user.username === username && user.password === password) {
    return res.sendStatus(200)
  } else {
    return res.sendStatus(401)
  }
})

app.post('/enable-passwordless-login', (req, res) => {
  user.pushSubscriptionRef = req.body
  user.passwordlessLoginIsEnabled = true

  res.sendStatus(200)
})

app.get('/check-passwordless-login-is-enabled', (req, res) => {
  res.send(user.passwordlessLoginIsEnabled ? 'true' : 'false')
})

app.post('/send-login-request-to-phone', (req, res) => {
  if (user.passwordlessLoginIsEnabled === false || !user.pushSubscriptionRef) {
    return res.sendStatus(500)
  }
  const { browser, operationalSystem } = req.body
  
  const request = {
    id: loginRequests.length,
    status: 'pending',
    browser,
    operationalSystem,
    createdAt: Date.now(),
  }
  loginRequests.push(request)

  const payload = JSON.stringify({
    title: '🛡 Login request to your account!',
    body: 'Authorize or report an invasion.',
    url: `${url}/?id=${request.id}#login-request`,
  })
  webpush.sendNotification(user.pushSubscriptionRef, payload)
    .catch(err => {
      console.error(err.stack);
    })
    
  loginRequestResponses.on('status_change', (infos) => {
    if (infos.id !== request.id) return;
    
    if (infos.status === 'allowed') return res.sendStatus(200);
    if (infos.status === 'blocked') return res.sendStatus(403);
    if (infos.status === 'pending') return;
  })
})

app.get('/get-login-request-infos', (req, res) => {
  const { id } = req.query
  const infos = loginRequests.find(req => req.id == id)

  if (!infos) {
    res.sendStatus(404)
  } else {
    res.send(infos)
  }
})

app.post('/answer-the-login-request', (req, res) => {
  const { status, id } = req.body
  if (status !== 'allowed' && status !== 'blocked') return res.sendStatus(400)

  const infos = loginRequests.find(req => req.id == id)
  
  if (infos.status !== 'pending') return res.sendStatus(403)
  
  const fivemins = 1000 * 60 * 5
  if (Date.now() - infos.createdAt >= fivemins) {
    infos.status = 'expired'

    return res.sendStatus(403)
  }
  
  infos.status = status
  
  loginRequestResponses.emit('status_change', infos)
  
  res.sendStatus(200)
})

void async function bootstrap() {
  url = await ngrok.connect(port)

  app.listen(port, () => {
    console.log(`Alive on ${url}`)
  })
}()