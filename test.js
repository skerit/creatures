var Blast = require('protoblast')(false),
    CreaturesApplication = require('./index.js'),
    app = new CreaturesApplication(),
    fs = require('fs');

app.getHandPosition(function got(err, res) {
	console.log(err, res);
});

app.getCreatures(function gotCreatures(err, creatures) {

	creatures[1].command('mvto 3904 797,setv grav 1,slim', function moved(err, res) {
		console.log(err, res);
	})

});

return;

app.getWorldName(function gotit(err, name) {
	console.log('WORLD NAME:', err, name);
});

app.getWorldHistory(function gotHistory(err, histories) {

});

//return;

var norn = new Blast.Classes.Develry.Creatures.Creature(app);

norn.loadByMoniker('1NJW', function done(err) {

	console.log('ERR:', err, norn)

	norn.getMother(function gotMother(err, mother) {

		console.log('---------------------');
		console.log('---------------------');
		console.log('Mother:', err, mother);

		mother.getChildren(function gotChildren(err, children) {

			console.log('Children:', err, children);

		})

	});

});

return;

app.getWorlds(function got(err, result) {
	console.log(err, result);
});

var norn = new Blast.Classes.Develry.Creatures.Creature(app);

norn.loadByMoniker('1NJW', function done(err) {

	console.log('ERR:', err, norn)

});

return;

app.command('dde: gids root', function done(err, result) {
	console.log('Done:', err, result);
});

return;

// app.getEggs(function gotEggs(err, egs) {

// });

var exec = require('child_process').exec;

exec('tasklist /v', function(err, stdout, stderr) {

	var list = '' + stdout,
	    lines = list.split('\n');


	console.log('Output:', lines);
});

return;

var crh = new Blast.Classes.Develry.Creatures.CrHistory(app, app.worlds_data_path + '\\History\\beta_02\\cr_1DSZ');

crh.load(function loaded(err) {

	if (err) {
		console.error(err);
	}

	console.log(crh);

});

return;
console.log(process.env.USERPROFILE);
console.log(process);

var os = require('os');
console.log(os.platform());
console.log(os.release()); //'10.8.0'

return;

var execFile = require('child_process').execFile;

var wmic = execFile('wmic', ['process', 'get', 'ProcessID,ExecutablePath'], function(err, stdout, stderr) {

	var out = stdout + '',
	    split = out.split('\n'),
	    line,
	    i;

	for (i = 0; i < split.length; i++) {
		line = split[i].trim();

		line = line.replace(/(\s+)\d+$/, '').replace(/\\\\/g, '\\');

		console.log(JSON.stringify(line));

		split[i] = line;
	}

	console.log(split)
	console.log('\\');

});

//fs.readdir('C:\\Documents and Settings\\')

wmic.stdin.end();

return;

// app.getCreatures(function gotCreatures(err, creatures) {

// 	console.log('Creatures updated:', err, creatures);
// });

app.getEggs(function gotEggs(err, egs) {

});

