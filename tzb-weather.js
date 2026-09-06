/* TimezoneBudy live weather — Open-Meteo (free, no API key).
   Fills the hero weather card, hourly strip, 7-day strip, and nearby-card temps
   using data-wx-lat / data-wx-lng attributes rendered by build.py. */
(function () {
  var WMO = { // weathercode -> emoji
    0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
    51:"🌦️",53:"🌦️",55:"🌧️",61:"🌦️",63:"🌧️",65:"🌧️",
    66:"🌧️",67:"🌧️",71:"🌨️",73:"🌨️",75:"❄️",77:"🌨️",
    80:"🌦️",81:"🌧️",82:"⛈️",85:"🌨️",86:"❄️",
    95:"⛈️",96:"⛈️",99:"⛈️"
  };
  var ico = function (c) { return WMO[c] || "🌡️"; };
  var round = Math.round;

  function hourLabel(iso) {
    var d = new Date(iso);
    var h = d.getHours();
    var ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + " " + ap;
  }
  function dayLabel(iso) {
    return new Date(iso + "T00:00").toLocaleDateString("en-US", { weekday: "short" });
  }
  function dateLabel(iso) {
    return new Date(iso + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function fillMain(lat, lng) {
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
      "&longitude=" + lng +
      "&current=temperature_2m,weather_code,apparent_temperature" +
      "&hourly=temperature_2m,precipitation_probability,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto&forecast_days=7";
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      // hero current
      if (d.current) {
        var t = document.getElementById("wx-temp");
        var i = document.getElementById("wx-ico");
        var s = document.getElementById("wx-desc");
        if (t) t.textContent = round(d.current.temperature_2m) + "°C";
        if (i) i.textContent = ico(d.current.weather_code);
        if (s) s.textContent = "Feels like " + round(d.current.apparent_temperature) + "°C";
      }
      // hourly — next 6 from now
      var hourly = document.getElementById("tzb-hourly");
      if (hourly && d.hourly) {
        var now = new Date();
        var start = 0, times = d.hourly.time;
        for (var k = 0; k < times.length; k++) {
          if (new Date(times[k]) >= now) { start = k; break; }
        }
        var out = "";
        for (var j = start; j < start + 6 && j < times.length; j++) {
          var lbl = j === start ? "Now" : hourLabel(times[j]);
          out += '<div class="hour"><div class="h">' + lbl + '</div>' +
            '<div class="ic">' + ico(d.hourly.weather_code[j]) + '</div>' +
            '<div class="t">' + round(d.hourly.temperature_2m[j]) + '°</div>' +
            '<div class="p">💧' + (d.hourly.precipitation_probability[j] || 0) + '%</div></div>';
        }
        hourly.innerHTML = out;
      }
      // 7-day
      var daily = document.getElementById("tzb-daily");
      if (daily && d.daily) {
        var o = "";
        for (var g = 0; g < d.daily.time.length; g++) {
          o += '<div class="d7"><div class="dow">' + dayLabel(d.daily.time[g]) + '</div>' +
            '<div class="dt">' + dateLabel(d.daily.time[g]) + '</div>' +
            '<div class="ic">' + ico(d.daily.weather_code[g]) + '</div>' +
            '<span class="hi">' + round(d.daily.temperature_2m_max[g]) + '°</span> ' +
            '<span class="lo">' + round(d.daily.temperature_2m_min[g]) + '°</span>' +
            '<div class="p">💧' + (d.daily.precipitation_probability_max[g] || 0) + '%</div></div>';
        }
        daily.innerHTML = o;
      }
    }).catch(function () {
      ["tzb-hourly", "tzb-daily"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="tzb-empty">Weather unavailable right now.</div>';
      });
      var s = document.getElementById("wx-desc");
      if (s) s.textContent = "Weather unavailable";
    });
  }

  // nearby-card temps (batched, one call each — small list)
  function fillNearby() {
    document.querySelectorAll(".tzb-ncard .wx[data-wx-lat]").forEach(function (el) {
      var lat = el.getAttribute("data-wx-lat"), lng = el.getAttribute("data-wx-lng");
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lng +
        "&current=temperature_2m,weather_code")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.current) el.textContent = ico(d.current.weather_code) + " " + round(d.current.temperature_2m) + "°";
        }).catch(function () { });
    });
  }

  function init() {
    var hero = document.querySelector(".tzb-hero[data-wx-lat]");
    if (hero) fillMain(hero.getAttribute("data-wx-lat"), hero.getAttribute("data-wx-lng"));
    fillNearby();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
