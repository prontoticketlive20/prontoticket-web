let loadedFacebookPixelIds = new Set();
let loadedTikTokPixelIds = new Set();
let loadedGtmIds = new Set();

const normalizeValue = (value) => String(value || "").trim();

const ensureDataLayer = () => {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  return window.dataLayer;
};

export const getEventPixelConfig = (event) => ({
  facebookPixelId: normalizeValue(event?.facebookPixelId),
  tiktokPixelId: normalizeValue(event?.tiktokPixelId),
  gtmId: normalizeValue(event?.gtmId),
});

export const loadFacebookPixel = (pixelId) => {
  const id = normalizeValue(pixelId);
  if (!id) return;

  if (!window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
  }

  if (!loadedFacebookPixelIds.has(id)) {
    window.fbq("init", id);
    loadedFacebookPixelIds.add(id);
  }
};

export const loadTikTokPixel = (pixelId) => {
  const id = normalizeValue(pixelId);
  if (!id) return;

  if (!window.ttq) {
    !(function (w, d, t) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
      ];
      ttq.setAndDefer = function (obj, method) {
        obj[method] = function () {
          obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function (pixel) {
        const inst = ttq._i[pixel] || [];
        for (let i = 0; i < ttq.methods.length; i++) {
          ttq.setAndDefer(inst, ttq.methods[i]);
        }
        return inst;
      };
      ttq.load = function (pixelId) {
        const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {};
        ttq._i[pixelId] = [];
        ttq._i[pixelId]._u = url;
        ttq._t = ttq._t || {};
        ttq._t[pixelId] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[pixelId] = {};
        const script = d.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.src = url + "?sdkid=" + pixelId + "&lib=" + t;
        const firstScript = d.getElementsByTagName("script")[0];
        firstScript.parentNode.insertBefore(script, firstScript);
      };
    })(window, document, "ttq");
  }

  if (!loadedTikTokPixelIds.has(id)) {
    window.ttq.load(id);
    loadedTikTokPixelIds.add(id);
  }
};

export const loadGtm = (gtmId) => {
  const id = normalizeValue(gtmId);
  if (!id) return;

  ensureDataLayer();

  if (!loadedGtmIds.has(id)) {
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    document.head.appendChild(script);

    loadedGtmIds.add(id);
  }
};

export const loadEventPixels = (event) => {
  const { facebookPixelId, tiktokPixelId, gtmId } = getEventPixelConfig(event);

  if (facebookPixelId) loadFacebookPixel(facebookPixelId);
  if (tiktokPixelId) loadTikTokPixel(tiktokPixelId);
  if (gtmId) loadGtm(gtmId);
};

const buildBasePayload = (event) => ({
  eventId: event?.id || null,
  eventTitle: event?.title || "",
  category: event?.category || "",
  saleType: event?.saleType || "",
});

export const trackViewContent = (event) => {
  const payload = buildBasePayload(event);

  if (window.fbq && normalizeValue(event?.facebookPixelId)) {
    window.fbq("track", "ViewContent", {
      content_name: payload.eventTitle,
      content_ids: [payload.eventId],
      content_type: "event",
      content_category: payload.category,
    });
  }

  if (window.ttq && normalizeValue(event?.tiktokPixelId)) {
    window.ttq.track("ViewContent", {
      content_name: payload.eventTitle,
      content_id: payload.eventId,
      content_type: "event",
    });
  }

  if (normalizeValue(event?.gtmId)) {
    ensureDataLayer().push({
      event: "view_content",
      ...payload,
    });
  }
};

export const trackAddToCart = ({ event, total = 0, currency = "USD", items = [] }) => {
  const payload = buildBasePayload(event);
  const quantity = items.reduce(
    (acc, item) => acc + Number(item?.quantity || 1),
    0
  );

  if (window.fbq && normalizeValue(event?.facebookPixelId)) {
    window.fbq("track", "AddToCart", {
      content_name: payload.eventTitle,
      content_ids: [payload.eventId],
      content_type: "event",
      value: Number(total || 0),
      currency,
      num_items: quantity,
    });
  }

  if (window.ttq && normalizeValue(event?.tiktokPixelId)) {
    window.ttq.track("AddToCart", {
      content_name: payload.eventTitle,
      content_id: payload.eventId,
      content_type: "event",
      value: Number(total || 0),
      currency,
      quantity,
    });
  }

  if (normalizeValue(event?.gtmId)) {
    ensureDataLayer().push({
      event: "add_to_cart",
      ...payload,
      total: Number(total || 0),
      currency,
      quantity,
      items,
    });
  }
};

export const trackPurchase = ({
  event,
  orderId,
  total = 0,
  currency = "USD",
  items = [],
}) => {
  const payload = buildBasePayload(event);
  const quantity = items.reduce(
    (acc, item) => acc + Number(item?.quantity || 1),
    0
  );

  if (window.fbq && normalizeValue(event?.facebookPixelId)) {
    window.fbq("track", "Purchase", {
      value: Number(total || 0),
      currency,
      content_name: payload.eventTitle,
      content_ids: [payload.eventId],
      content_type: "event",
      num_items: quantity,
      order_id: orderId || null,
    });
  }

  if (window.ttq && normalizeValue(event?.tiktokPixelId)) {
    window.ttq.track("CompletePayment", {
      value: Number(total || 0),
      currency,
      content_name: payload.eventTitle,
      content_id: payload.eventId,
      content_type: "event",
      quantity,
      order_id: orderId || null,
    });
  }

  if (normalizeValue(event?.gtmId)) {
    ensureDataLayer().push({
      event: "purchase",
      ...payload,
      orderId: orderId || null,
      total: Number(total || 0),
      currency,
      quantity,
      items,
    });
  }
};