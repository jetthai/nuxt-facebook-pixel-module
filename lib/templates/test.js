// plugins/pixel-tracker.client.js

export default ({ app }, inject) => {
  function getQueryPixelId() {
    if (process.client && window.location) {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('pixel_id') || undefined
    }
    return undefined
  }

  function getGtmPixelIds() {
    try {
      return (window.fbq?.getState?.()?.pixels || []).map(p => p.id) || []
    } catch (err) {
      return []
    }
  }

  function ensurePixelSDK() {
    return new Promise(resolve => {
      if (typeof window.fbq === 'function') {
        resolve()
        return
      }

      ; (function (f, b, e, v, n, t, s) {
        if (f.fbq) return
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        }
        if (!f._fbq) f._fbq = n
        n.push = n
        n.loaded = true
        n.version = '2.0'
        n.queue = []
        t = b.createElement(e)
        t.async = true
        t.src = 'https://connect.facebook.net/en_US/fbevents.js'
        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
        t.onload = () => resolve()
      })(window, document, 'script')
    })
  }

  async function initPixels(pixelIds) {
    await ensurePixelSDK()
    const fbq = window.fbq
    const initialized = getInitializedPixelIds()
    pixelIds.forEach(id => {
      if (!initialized.includes(id)) {
        fbq('init', id)
      }
    })
  }

  function getInitializedPixelIds() {
    try {
      return (window.fbq?.getState?.()?.pixels || []).map(p => p.id) || []
    } catch (err) {
      return []
    }
  }

  async function trackEvent(eventName, payload = {}) {
    const queryPixelId = getQueryPixelId()
    const gtmPixelIds = getGtmPixelIds()

    const allPixelIds = [...gtmPixelIds]
    if (queryPixelId && !allPixelIds.includes(queryPixelId)) {
      allPixelIds.push(queryPixelId)
    }

    await initPixels(allPixelIds)

    allPixelIds.forEach(id => {
      window.fbq('trackSingle', id, eventName, payload)
    })
  }

  inject('pixelTracker', {
    trackEvent
  })
}
