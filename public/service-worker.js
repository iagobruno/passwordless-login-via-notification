self.addEventListener('push', async (event) => {
  const { title, ...data } = event.data.json()

  event.waitUntil(
    self.registration.showNotification(title, {
      ...data,
      icon: 'https://itsnews.uncg.edu/wp-content/uploads/2019/07/securtityAlert.png',
      data: {
        url: data.url
      },
      tag: 'login-request',
      renotify: true,
      requireInteraction: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  const { notification } = event
  notification.close();

  event.waitUntil(
    clients.openWindow(notification.data.url)
  )
})
