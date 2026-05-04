(function () {
  var config = window.AVTOLOGIST_SUPABASE || {};

  function headers() {
    return {
      apikey: config.key || "",
      Authorization: "Bearer " + (config.key || ""),
      "Content-Type": "application/json"
    };
  }

  function endpoint(path) {
    return (config.url || "").replace(/\/$/, "") + "/rest/v1/" + path.replace(/^\//, "");
  }

  function hasConfig() {
    return Boolean(config.url && config.key);
  }

  function ping() {
    if (!hasConfig()) {
      return Promise.resolve({
        ok: false,
        status: 0,
        message: "Supabase не настроен"
      });
    }

    return fetch(endpoint("vehicles?select=id&limit=1"), {
      method: "GET",
      headers: headers()
    })
      .then(function (response) {
        if (response.ok) {
          return {
            ok: true,
            status: response.status,
            message: "Сервер подключен, таблицы доступны"
          };
        }
        if (response.status === 401 || response.status === 403) {
          return {
            ok: true,
            status: response.status,
            message: "Сервер найден. Для записи нужен вход перевозчика"
          };
        }
        return response.text().then(function (text) {
          return {
            ok: false,
            status: response.status,
            message: "Сервер ответил с ошибкой: " + (text || response.status)
          };
        });
      })
      .catch(function () {
        return {
          ok: false,
          status: 0,
          message: "Не удалось связаться с Supabase"
        };
      });
  }

  window.AutologistServer = {
    ping: ping
  };
})();

