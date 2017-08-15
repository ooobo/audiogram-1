var serverSettings = require("../lib/settings/"),
    spawn = require("child_process").spawn,
    path = require("path"),
    _ = require("underscore"),
    fs = require("fs"),
    logger = require("../lib/logger"),
    transports = require("../lib/transports"),
    uuidv4 = require('uuid/v4');

function validate(req, res, next) {

  console.log("RLW validating");
  console.log(req.files);

  try {

    req.body.theme = JSON.parse(req.body.theme);
    req.body.media = JSON.parse(req.body.media);

  } catch(e) {

    return res.status(500).send("Unknown settings error.");

  }

  // var audioFile = req.files['audio'][0]
  // if (!audioFile || !audioFile.filename) {
  if (!req.body.media.audio || !req.body.media.audio.path) {
    return res.status(500).send("No valid audio received.");
  }

  var audioExists = fs.existsSync(req.body.media.audio.path);
  if (!audioExists) {
    return res.json({error: "reupload"});
  }

  // Start at the beginning, or specified time
  if (req.body.start) {
    req.body.start = +req.body.start;
  }

  if (req.body.end) {
    req.body.end = +req.body.end;
  }

  next();

}

function route(req, res) {

  console.log("RLW routing");
  var jobId = uuidv4();

  if (req.body.media.background) {
    var backgroundSrc = req.body.media.background.path,
        backgroundId = backgroundSrc.split(path.sep).reverse()[1],
        backgroundImagePath = "background/" + backgroundId;
    transports.uploadBackground(backgroundSrc, backgroundImagePath, function(err) {
      if (err) {
        throw err;
      }
    });
  }

  if (req.body.media.foreground) {
    var foregroundSrc = req.body.media.foreground.path,
        foregroundId = foregroundSrc.split(path.sep).reverse()[1],
        foregroundImagePath = "foreground/" + foregroundId;
    transports.uploadBackground(foregroundSrc, foregroundImagePath, function(err) {
      if (err) {
        throw err;
      }
    });
  }

  var audioSrc = req.body.media.audio.path,
      audioId = audioSrc.split(path.sep).reverse()[1],
      audioPath = "audio/" + jobId;
  transports.uploadAudio(audioSrc, audioPath, function(err) {

    if (err) {
      console.log("RLW routing err");
      throw err;
    }

    // Queue up the job with a timestamp
    var themeWithBackgroundImage =  _.extend(req.body.theme, { audioPath: audioPath, customBackgroundPath: backgroundImagePath, customForegroundPath: foregroundImagePath });
    transports.addJob(_.extend({ id: jobId, created: (new Date()).getTime(), media: req.body.media, theme: themeWithBackgroundImage }, req.body));

    res.json({ id: jobId });

    // If there's no separate worker, spawn one right away
    if (!serverSettings.worker) {

      logger.debug("Spawning worker");

      // Empty args to avoid child_process Linux error
      spawn("bin/worker", [], {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
        env: _.extend({}, process.env, { SPAWNED: true })
      });

    }

  });

};

module.exports = {
  validate: validate,
  route: route
};
