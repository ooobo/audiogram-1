var transports = require("../lib/transports");

function getList(req, res) {

	var email = req.header('BBC_IDOK') ? req.header('BBC_EMAIL') : 'null';

	transports.getProjectList(function(err, projects){

		if (err) return res.json({err: err});
		var list = [];
		for (var i = 0; i < projects.length; i++) {
			// Only return this user's projects
			if (projects[i].user==email) {
				var id = projects[i].id,
					audioId = projects[i].media.audio.path.split(path.sep).reverse()[1],
					user = projects[i].user,
					date = projects[i].created,
					duration = +projects[i].duration;
				list.push({ id: id, audioId: audioId, user: user, date: date, duration: duration });
			}
		}
		return res.json(list);

	});

}

function getProject(req, res) {

		return res.json({err: null});
}

module.exports = {
  getList: getList,
  getProject: getProject
};