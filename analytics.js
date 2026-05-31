/* Shared analytics for the MTM static site.
   PostHog project key (phc_...) is public — safe to inline (no build step).
   Loaded on every page via: <script src="/analytics.js" defer></script>
   Coexists with the Meta Pixel; does not touch fbq. */
(function () {
  'use strict';

  var POSTHOG_KEY = 'phc_mareh3iMAhxPpjbj3Gc2xEXw4fDJqrtemV8fBotkhqhq';
  var POSTHOG_HOST = 'https://eu.i.posthog.com';

  /* --- PostHog snippet (official, trimmed) --- */
  !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]), t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "), n = 0; n < o.length; n++) g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);

  window.posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'always',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true
  });

  /* --- Stripe checkout: attach distinct_id as client_reference_id so the
     server webhook can match the completed purchase back to this visitor. --- */
  function decorateStripeLink(link) {
    try {
      var id = window.posthog.get_distinct_id && window.posthog.get_distinct_id();
      if (!id) return;
      var url = new URL(link.href);
      url.searchParams.set('client_reference_id', id);
      link.href = url.toString();
    } catch (e) { /* no-op */ }
  }

  function isStripeLink(el) {
    return el && el.closest && el.closest('a[href*="buy.stripe.com"]');
  }

  // Decorate on click (capture phase, before any navigation) + fire event.
  document.addEventListener('click', function (e) {
    var link = isStripeLink(e.target);
    if (!link) return;
    decorateStripeLink(link);
    window.posthog.capture('checkout_click', { price: 297, currency: 'USD' });
  }, true);

  // Also decorate up front so right-click/keyboard navigation carries the id.
  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('a[href*="buy.stripe.com"]');
    for (var i = 0; i < links.length; i++) decorateStripeLink(links[i]);
  });

  /* --- Lead form (/3ways): fire lead_submitted before the cross-domain
     redirect. Use sendBeacon so it survives navigation. No PII in capture();
     email goes only into identify(). --- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest && e.target.closest('#activecampaign-form');
    if (!form) return;
    var emailEl = form.querySelector('input[name="email"]');
    var email = emailEl && emailEl.value;
    if (email) window.posthog.identify(email);
    window.posthog.capture('lead_submitted', { transport: 'sendBeacon' });
  }, true);
})();
