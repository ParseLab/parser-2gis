const readline = require('readline');
const cp = require('child_process')
const fs = require('fs')
var ver = JSON.parse(fs.readFileSync('version.json'))
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question(`Enter version number [${ver}]: `, (answer) => {
	rl.close();
	if (answer.trim() != '') ver = answer
	cp.exec(`/media/vitaly/Data/projects/parser2gis1/node_modules/.bin/build --win --ia32 --dir -c.extraMetadata.version=${ver}`, (e, r) => {
		if (e) console.error(e)
		else console.log(r)
		cp.exec(`wine "z:/media/vitaly/Data/public/Inno Setup 5/iscc.exe" -DAppVersion=${ver} parser2gis4.iss`, (e, r) => {
			if (e) console.error(e)
			else {
				console.log(r)
				var latest = {
					version: ver,
					url: 'parser2gis' + ver + '.exe'
				}
				fs.writeFileSync('version.json', JSON.stringify(ver))
				fs.writeFileSync('dist/latest.json', JSON.stringify(latest))
/* 				try{
					cp.execSync(`sshfs -o nonempty vitaly@homeo:/var/www/parselab.org /media/vitaly/homeo`)
				} catch(e){

				}
				
				cp.execSync(`cp -f dist/${latest.url} /media/vitaly/homeo/download/`) */
			}
		})
	})
});
