import { h, render, Component } from 'https://unpkg.com/preact@latest?module'
import { useState, useEffect, useRef, useMemo } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module'
import htm from "https://unpkg.com/htm@latest/dist/htm.module.js?module"

const html = htm.bind(h)

class App extends Component {
  componentDidMount() {
    window.onhashchange = () => {
      this.setState({
        page: location.hash.replace(/^\#/, '')
      })
    }
    window.onhashchange()

    // ⚠ UNSAFE! Just to keep the example simple
    const isLogged = localStorage.getItem('previously_logged_in')
    if (!isLogged) {
      location.hash = 'login'
    }
    if (isLogged && !location.hash) {
      location.hash = 'home'
    }
  }

  componentWillUnmount() {
    window.onhashchange = undefined
  }

  render() {
    const { page } = this.state

    return html`${
      page === 'login' ? html`<${LoginPage} />` :
      page === 'home' ? html`<${HomePage} />` :
      page === 'login-request' ? html`<${LoginRequestPage} />`
      : null
    }`
  }
}

function LoginPage(props) {
  const [screen, setScreen] = useState('username-field')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const polling = useRef(null)
  
  useEffect(() => {
    let timer;
    if (screen === 'allowed') {
      // ⚠ UNSAFE! Just to keep the example simple
      localStorage.setItem('previously_logged_in', true)

      timer = setTimeout(() => {
        location.hash = 'home'
      }, 1000)
    }
    
    return () => clearTimeout(timer)
  }, [screen])

  function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (screen === 'username-field') {
      if (username.trim().length === 0) return setError('Type the username!');

      fetch(`/check-username?username=${username}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'unregistered_user') {
            return setError("User doesn't exist!")
          }

          if (data.passwordlessLoginIsEnabled) {
            setScreen('passwordless')
            polling.current = sendLoginAttempt((res) => {
              if (res.status === 200) setScreen('allowed')
              else if (res.status === 403) setScreen('blocked')
            })
          } else {
            setScreen('password-field')
          }
        })
    }
    else if (screen === 'password-field') {
      if (password.trim().length === 0) return setError('Type the password!');

      fetch(`/sign-in`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
        .then(res => {
          if (res.ok) {
            setScreen('allowed')
            if (polling.current) polling.current.abort()
          }
          else {
            return setError('Incorrect username or password!');
          }
        })
    }
  }
  
  function showPasswordField(event) {
    event.preventDefault()
    event.stopPropagation()
    if (screen !== 'passwordless') return;
    
    polling.current.abort()
    setScreen('password-field')
  }

  if (screen === 'blocked') {
    return html`
      <div class="page--login">
        <div class="big-icon">❌</div>
        <h1>Login attempt blocked</h1>
        <img class="police" src="/images/police.jpg" />
      </div>
    `
  }
  
  if (screen === 'allowed') {
    return html`
      <div class="page--login">
        <div class="big-icon">✔</div>
        <h1>Successfully logged in!</h1>
      </div>
    `
  }

  return html`
    <div class="page--login">
      <form onSubmit=${handleSubmit}>
        <h1>Login</h1>
        ${screen === 'username-field' ? html`
          <label class="matter-textfield-outlined">
            <input autofocus value=${username} onInput=${(evt => setUsername(evt.target.value))} />
            <span>Username</span>
            <div>The default user is "admin".</div>
          </label>
          ${error && html`<div class="error">${error}</div>`}
          <button class="matter-button-contained">Next 👉</button>
        ` :
        screen === 'password-field' ? html`
          <div class="greetings">Hello, <strong>${username}</strong></div>
          <label class="matter-textfield-outlined">
            <input autofocus value=${password} onInput=${(evt => setPassword(evt.target.value))} />
            <span>Enter the password</span>
            <div>The default password is "admin".</div>
          </label>
          ${error && html`<div class="error">${error}</div>`}
          <button class="matter-button-contained">Login 🚪</button>
        ` :
        screen === 'passwordless' ? html`
          <div class="greetings">Hello, <strong>${username}</strong></div>
          <div class="passwordless-tip">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcSeAYw5tXKuTj-rl3e2xiXVTJQmDcut1YqZA3N99XDWNARcerz0" height="60" width="60" />
            Check your phone to authorize the login if you don't remember or it's hard to type password.<br/>
            Waiting...
          </div>
          Or
          <button class="matter-button-outlined" onClick=${showPasswordField}>Enter the password</button>
        `
        : null}
      </form>
    </div>
  `
}

function HomePage() {
  const [showConfigurationCard, setShowConfigurationCard] = useState(false)

  useEffect(() => {
    // ⚠ UNSAFE! Just to keep the example simple
    const isNotLogged = localStorage.getItem('previously_logged_in') === undefined
    if (isNotLogged) {
      location.hash = 'login'
    }
  }, [])

  useEffect(() => {
    if (isMobile) {
      fetch('/check-passwordless-login-is-enabled')
      .then(res => res.text())
      .then(res => {
        setShowConfigurationCard(res == 'false')
      })
    }
  }, [])

  async function handleEnableClick() {
    const pushSubscription = await getPushManagerSubscription()

    await fetch('/enable-passwordless-login', {
      method: 'POST',
      body: JSON.stringify(pushSubscription),
      headers: { 'content-type': 'application/json' }
    })
      .then((res) => {
        // console.log(res)
        setShowConfigurationCard(false)
      })
      .catch(console.error)
  }

  return html`
    <div class="center">
      <h1>Welcome, admin!</h1>
      ${showConfigurationCard ? html`
        <div class="card">
          <strong>Use your smartphone to sign in</strong>
          Instead of typing in your password every time you login, get a notification on your smartphone to authorize entry.
          <button class="matter-button-contained" onClick=${handleEnableClick}>Enable 👍</button>
        </div>
      ` : html`
        <div style="margin: 20px 0">Try signing in to another device. 👀</div>
      `}
      <div class="card"></div>
      <div class="card"></div>
      <div class="card"></div>
      <div class="card"></div>
      <div class="card"></div>
    </div>
  `
}

function LoginRequestPage(props) {
  const [screen, setScreen] = useState('ask')
  const [infos, setInfos] = useState()
  const [error, setError] = useState(false)
  const ID = useMemo(() => getQueryString('id'), [])
  
  useEffect(() => {
    fetch('/get-login-request-infos?id=' + ID)
      .then(async (res) => {
        if (res.ok) setInfos(await res.json())
        else setError(true)
      })
      .catch(() => setError(true))
  }, [])
  
  async function handleButtonClick(status) {
    await fetch('/answer-the-login-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, id: ID }),
    })

    setScreen(status)
  }

  if (error) return 'ERROR'
  if (!infos) return 'Loading...'
  
  return html`
    <div class="page--login-request">
      ${screen === 'ask' ? html`
        <div class="big-icon">🛡</div>
        <h1>Are you trying to login on another device?</h1>
        <div style="margin-bottom: 0">Device: ${infos.browser} on ${infos.operationalSystem}</div>
        <div>Time: Just now</div>
        <button class="matter-button-contained" onClick=${() => handleButtonClick('allowed')}>ALLOW</button>
        <button class="matter-button-outlined" onClick=${() => handleButtonClick('blocked')}>BLOCK</button>
      ` :
      screen === 'blocked' ? html`
        <div class="big-icon">🚨</div>
        <h1>Login attempt blocked!</h1>
      ` :
      screen === 'allowed' ? html`
        <div class="big-icon">✔</div>
        <h1>Login has been authorized</h1>
      `
      : null}
    </div>
  `
}


function sendLoginAttempt(callback) {
  const controller = new AbortController();
  const signal = controller.signal;

  const UA = new UAParser()

  fetch('/send-login-request-to-phone', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      browser: UA.getBrowser().name,
      operationalSystem: UA.getOS().name,
    }),
    signal
  })
    .then(callback)

  return {
    abort: () => controller.abort()
  }
}

const publicVapidKey = 'BOV4vnqYSiDkUbo7k-q4up2CCSv-kXBYY7BLAV3Xx4dVOXNJU-HvWzp2YuwzSC-EDMq2DZQjotejqZedlekLK8s'

async function getPushManagerSubscription() {
  const swRegistration = await navigator.serviceWorker.getRegistration()
  let subscription = await swRegistration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    })
  }

  return subscription.toJSON()
}

// Boilerplate borrowed from https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getQueryString(key) {
  const items = location.search.substring(1)
    .split('&')
    .map(item => item.split('='))
  const obj = Object.fromEntries(items)
  
  if (key !== undefined) {
    return obj[key]
  } else {
    return obj
  }
}

const ua = navigator.userAgent||navigator.vendor||window.opera;
const isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4));




const root = document.querySelector('main')
render(
  html`
    <${App} />
  `,
  root
)
