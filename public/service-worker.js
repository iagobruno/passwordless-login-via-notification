self.addEventListener('push', async (event) => {
  const data = event.data.json()

  event.waitUntil(new Promise(async resolve => {
    await clearNotifications('login-request')
    await showNotification({
      ...data,
      icon: 'https://itsnews.uncg.edu/wp-content/uploads/2019/07/securtityAlert.png',
      data: {
        url: data.url
      },
      tag: 'login-request',
      requireInteraction: true,
      renotify: true,
    })
    resolve();
  }))
})

self.addEventListener('notificationclick', (event) => {
  const { notification } = event
  console.log('click', event)
  notification.close();

  event.waitUntil(
    clients.openWindow(notification.data.url)
  )
})


async function clearNotifications(tag) {
  const notifications = await self.registration.getNotifications()

  notifications.forEach(notif => {
    if (tag !== undefined && notif.tag === tag) return notif.close();

    notif.close()
  })
  
  return;
}

function showNotification({ title, ...data }) {
  return self.registration.showNotification(title, data)
}